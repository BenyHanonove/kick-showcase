// Empties every DEV DynamoDB table so leftover test data can't fail the next run.
// Dev tables are "dev-BarOps-*"; production tables have no prefix and are never touched.
import { fileURLToPath } from 'url';
import {
  DynamoDBClient,
  ListTablesCommand,
  DescribeTableCommand,
  ScanCommand,
  BatchWriteItemCommand,
} from '@aws-sdk/client-dynamodb';

const REGION = 'eu-west-1';
const DEV_PREFIX = 'dev-BarOps-';
const BATCH_SIZE = 25;

// No [default] in ~/.aws/credentials, so the named profile must be passed explicitly
const client = new DynamoDBClient({ region: REGION, profile: process.env.AWS_PROFILE || 'benjamin' });

const isDevTable = (name) => name.startsWith(DEV_PREFIX);

async function listDevTables() {
  const names = [];
  let start;
  do {
    const res = await client.send(new ListTablesCommand({ ExclusiveStartTableName: start }));
    names.push(...(res.TableNames || []));
    start = res.LastEvaluatedTableName;
  } while (start);
  return names.filter(isDevTable);
}

// Retry until DynamoDB accepts every delete in the batch
async function deleteBatch(tableName, keys) {
  let requests = { [tableName]: keys.map((Key) => ({ DeleteRequest: { Key } })) };
  for (let attempt = 0; requests[tableName]?.length; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, Math.min(2000, 100 * 2 ** attempt)));
    const res = await client.send(new BatchWriteItemCommand({ RequestItems: requests }));
    requests = res.UnprocessedItems || {};
  }
}

async function emptyTable(tableName) {
  // Hard stop: never delete from a table outside dev
  if (!isDevTable(tableName)) throw new Error(`Refusing to clean non-dev table "${tableName}"`);

  const { Table } = await client.send(new DescribeTableCommand({ TableName: tableName }));
  const keyNames = Table.KeySchema.map((k) => k.AttributeName);

  // Only key attributes are read; aliased to dodge reserved words like "token"
  const names = Object.fromEntries(keyNames.map((k, i) => [`#k${i}`, k]));
  const projection = Object.keys(names).join(', ');

  let deleted = 0;
  let startKey;
  do {
    const res = await client.send(new ScanCommand({
      TableName: tableName,
      ProjectionExpression: projection,
      ExpressionAttributeNames: names,
      ExclusiveStartKey: startKey,
    }));
    const keys = res.Items || [];
    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      await deleteBatch(tableName, keys.slice(i, i + BATCH_SIZE));
    }
    deleted += keys.length;
    startKey = res.LastEvaluatedKey;
  } while (startKey);

  return deleted;
}

export async function cleanDevTables() {
  const tables = await listDevTables();
  console.log(`🧹 Cleaning ${tables.length} dev tables (${DEV_PREFIX}*)...`);

  let total = 0;
  for (const table of tables) {
    const deleted = await emptyTable(table);
    total += deleted;
    console.log(`   ${table}: ${deleted} items deleted`);
  }

  console.log(`🧹 Dev clean done - ${total} items deleted`);
  return true;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  cleanDevTables().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

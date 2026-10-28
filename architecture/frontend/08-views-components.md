# Layer 8 — Views & the KICK component system

**Files:** `src/modules/<domain>/views/*.vue` ·
[`shared/components/`](../../bar-ops-dashboard/src/modules/shared/components/) (index at
`components/index.ts`)

## Shape of a list view

[`ClientView.vue`](../../bar-ops-dashboard/src/modules/client/views/ClientView.vue) is
the canonical page — copy it:

```vue
<template>
  <v-container>
    <PageHeader v-model="query" :path="['בית', 'לקוחות']" title="לקוחות" desc="…"
                search-label="חפש לקוח לפי שם…" :min-role="UserRole.MANAGER" :actions="pageActions" />

    <AppTable :headers="tableHeaders" :items="results" :loading="loading"
              empty-icon="mdi-account-multiple-outline" empty-feature="לקוחות">
      <template #phone="{ value }">…</template>
      <template #actions="{ item }">
        <v-menu …><AppList :actions="itemMenuActions(item)" /></v-menu>
      </template>
    </AppTable>

    <AppDialog v-model="Crud.createDialogOpen.value" type="raw">
      <GenericForm title="יצירת לקוח חדש" submit-text="צור לקוח" :fields="Crud.clientFields"
                   :initial-values="Crud.clientInitialState" :loading="Crud.isCreating.value"
                   show-reset @submit="Crud.handleCreate" />
    </AppDialog>
    <!-- update dialog: same, with :initial-values="Crud.selectedItem.value" -->
    <AppDialog v-model="Crud.deleteDialogOpen.value" type="delete" … @confirm="Crud.handleDelete" />
  </v-container>
</template>
```

The `<script setup>` half is only: store refs (`storeToRefs`), `useSearch`, the CRUD
composable, the table headers, and the role-gated action lists.

## The component library

| Group | Components |
| --- | --- |
| Data | `AppTable`, `AppCalendar`, `MetricCard`, `StatusChip`, `DistributionBar`, `SummaryBreakdown`, `EmptyState` |
| Forms | `GenericForm`, `AppFormCard`, `AppFilter`, `SearchBar` |
| Input | `AppInput`, `AppListSelect`, `AppApprovalGate`, `FileDragDrop`, `TimingSelector` |
| Layout | `AppLayout`, `AppBar`, `AppDrawer`, `AppCard`, `AppButton`, `AppList`, `AppListItem`, `PageHeader`, `SummaryPanel`, `ModuleSummaryCard`, `InitialsAvatar`, `AppLogo` |
| Dialogs / feedback | `AppDialog`, `ReceiptDialog`, `AppSnackbar`, `GlobalLoading` |

Use these instead of raw Vuetify components — they carry the KICK theme, RTL handling
and spacing. Raw `v-*` is acceptable for primitives the library does not wrap
(`v-container`, `v-menu`, `v-row`).

## Action menus

Every row/action menu uses `AppList` with `IListAction[][]` — the outer array is visual
groups, and **destructive actions get their own group**:

```ts
const itemMenuActions = (client: IClient): IListAction[][] => {
  const groups: IListAction[][] = [[{ title: 'עדכן', icon: 'mdi-pencil', handler: () => Crud.openUpdate(client) }]]
  if (isAdmin.value) groups.push([{ title: 'מחק', icon: 'mdi-delete', color: 'error', handler: () => Crud.openDelete(client) }])
  return groups
}
```

Authorization in views is a `computed` over `AuthStore` (`isAdmin`) or `PageHeader`'s
`min-role` — never an inline string comparison.

## Conventions

- Hebrew/RTL first: labels, empty states and dialog copy are Hebrew; a required field is
  marked with a trailing `*`.
- Colors and spacing come from the theme tokens — no hardcoded hex values.
- `EmptyState` (via `AppTable`'s `empty-*` props) instead of an empty grid.
- Icons are MDI names (`mdi-…`).

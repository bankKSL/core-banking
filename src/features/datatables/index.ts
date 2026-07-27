export type {
  Datatable,
  DatatableColumn,
  DatatableEntry,
  EntityDatatableCheck,
  EntityDatatableCheckTemplate,
} from "./api/datatables";

export {
  fetchDatatables,
  fetchDatatable,
  fetchDatatableEntries,
  createDatatableEntry,
  updateDatatableEntry,
  deleteDatatableEntry,
  registerDatatable,
  deregisterDatatable,
  createDatatable,
  deleteDatatable,
  fetchEntityDatatableChecks,
  fetchEntityDatatableCheckTemplate,
  createEntityDatatableCheck,
  deleteEntityDatatableCheck,
} from "./api/datatables";

export {
  datatableKeys,
  useDatatables,
  useDatatable,
  useDatatableEntries,
  useCreateDatatableEntry,
  useUpdateDatatableEntry,
  useDeleteDatatableEntry,
  useRegisterDatatable,
  useDeregisterDatatable,
  useCreateDatatable,
  useDeleteDatatable,
  useEntityDatatableChecks,
  useEntityDatatableCheckTemplate,
  useCreateEntityDatatableCheck,
  useDeleteEntityDatatableCheck,
} from "./hooks/useDatatables";

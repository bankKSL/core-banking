export type {
  ShareProduct,
  ShareProductTemplate,
  ShareAccount,
  ShareAccountTemplate,
  Dividend,
} from "./api/shares";

export {
  fetchShareProducts,
  fetchShareProduct,
  fetchShareProductTemplate,
  createShareProduct,
  updateShareProduct,
  fetchShareAccounts,
  fetchShareAccount,
  fetchShareAccountTemplate,
  createShareAccount,
  updateShareAccount,
  shareAccountCommand,
  fetchDividends,
  createDividend,
  approveDividend,
  deleteDividend,
} from "./api/shares";

export {
  shareKeys,
  useShareProducts,
  useShareProduct,
  useShareProductTemplate,
  useCreateShareProduct,
  useUpdateShareProduct,
  useShareAccounts,
  useShareAccount,
  useShareAccountTemplate,
  useCreateShareAccount,
  useUpdateShareAccount,
  useShareAccountCommand,
  useDividends,
  useCreateDividend,
  useApproveDividend,
  useDeleteDividend,
} from "./hooks/useShares";

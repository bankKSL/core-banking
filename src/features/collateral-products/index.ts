export type { CollateralProduct, CollateralProductCreateRequest, CollateralProductUpdateRequest, CollateralProductCommandResponse, CollateralProductTemplate } from "./types/collateralProduct";

export { fetchCollateralProducts, fetchCollateralProduct, fetchCollateralProductTemplate, createCollateralProduct, updateCollateralProduct, deleteCollateralProduct } from "./api/collateralProducts";

export { useCollateralProducts, useCollateralProduct, useCollateralProductTemplate, useCreateCollateralProduct, useUpdateCollateralProduct, useDeleteCollateralProduct, collateralProductKeys } from "./hooks/useCollateralProducts";

export { createCollateralProductSchema, updateCollateralProductSchema } from "./schemas/collateralProduct.schema";
export type { CreateCollateralProductFormValues, UpdateCollateralProductFormValues } from "./schemas/collateralProduct.schema";

export { default as CollateralProductListPage } from "./pages/CollateralProductListPage";
export { default as CollateralProductFormPage } from "./pages/CollateralProductFormPage";

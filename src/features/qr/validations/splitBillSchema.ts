import * as yup from "yup";

export const splitBillSchema = yup.object({
  mode: yup
    .mixed<"by_device" | "equal" | "items">()
    .oneOf(["by_device", "equal", "items"])
    .required(),
  people_count: yup.number().min(2).max(30).nullable(),
});

export type SplitBillValues = yup.InferType<typeof splitBillSchema>;

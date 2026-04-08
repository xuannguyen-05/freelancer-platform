const { z } = require("zod");
const { objectIdSchema } = require("../utils/objectIdSchema")


const createContractSchema = z
  .object({
    projectId: objectIdSchema,
    freelancerId: objectIdSchema,
    type: z.enum(["fixed", "hourly"]),
    price: z.number().min(0),
    hours: z.number().min(0).optional(),
  })
  .refine(
    (data) => {
      if (data.type === "hourly") {
        return data.hours != null;
      }

      if (data.type === "fixed") {
        return data.hours == null;
      }

      return true;
    },
    {
      message: "Invalid hours for contract type",
    },
  );

const updateContractSchema = z
  .object({
    price: z.number().min(0).optional(),
    hours: z.number().min(0).optional(),
    type: z.enum(["fixed", "hourly"]).optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.price !== undefined ||
      data.hours !== undefined ||
      data.type !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

const updateStatusSchema = z.object({
  status: z.enum(["active", "completed", "cancelled"]),
});

const paySchema = z.object({
  amount: z.number().positive()
})

module.exports = {
  createContractSchema,
  updateContractSchema,
  updateStatusSchema,
  paySchema
};

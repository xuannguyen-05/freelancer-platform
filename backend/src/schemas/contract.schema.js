const { z } = require("zod");
const { objectIdSchema } = require("../utils/objectIdSchema")


const createContractSchema = z
  .object({
    projectId: objectIdSchema,
    freelancerId: objectIdSchema,
    memberIds: z.array(objectIdSchema).optional(),
    type: z.enum(["fixed", "hourly"]),
    price: z.number().positive(),
    hours: z.number().positive().optional(),
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
    price: z.number().positive().optional(),
    hours: z.number().positive().optional(),
    type: z.enum(["fixed", "hourly"]).optional(),
    memberIds: z.array(objectIdSchema).optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.price !== undefined ||
      data.hours !== undefined ||
      data.type !== undefined ||
      data.memberIds !== undefined,
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

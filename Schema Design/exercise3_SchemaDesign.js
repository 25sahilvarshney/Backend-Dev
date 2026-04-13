const optimalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    age: { type: Number, min: 0 },
    gpa: { type: Number, min: 0.0, max: 4.0 },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    address: {
      street: String,
      city: { type: String, required: true },
      state: String,
      zipCode: String,
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
  },
  {
    timestamps: true,
    collection: "students",
    versionKey: false,
  },
);

optimalSchema.index({ email: 1 });
optimalSchema.index({ gpa: -1 });
optimalSchema.index({ "address.city": 1 });
optimalSchema.index({ status: 1, gpa: -1 });

const Student = mongoose.model("Students", optimalSchema);














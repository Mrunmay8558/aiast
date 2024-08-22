import mongoose from "mongoose";

const speechToTextSchema = new mongoose.Schema(
  {
    transcribedText: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Transcription = mongoose.model("Transcription", speechToTextSchema);

export default Transcription;

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const aiService = require("./aiService");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize AI model
aiService.initializeAI();

// Connect to MongoDB
const connectWithRetry = () => {
  mongoose
    .connect("mongodb://mongo:27017/brainbytes", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
    })
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.error("Failed to connect to MongoDB. Retrying in 5 seconds...", err);
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

// Define schemas
const messageSchema = new mongoose.Schema({
  text: String,
  isUser: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  subject: { type: String, default: "General" }, // Add this line
});

const Message = mongoose.model("Message", messageSchema);

const userProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  preferredSubjects: [String],
});

const UserProfile = mongoose.model("UserProfile", userProfileSchema);

const learningMaterialSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  content: { type: String, required: true },
});

const LearningMaterial = mongoose.model("LearningMaterial", learningMaterialSchema);

// API Routes
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the BrainBytes API" });
});

// Get all messages
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/messages", async (req, res) => {
  try {
    // Use the subject from the request body if provided
    let subject = req.body.subject || "General";

    // Only fall back to auto-detection if no subject was specified
    if (!subject) {
      // Detect subject based on message content
      const text = req.body.text.toLowerCase();

      if (
        text.includes("math") ||
        text.includes("equation") ||
        text.includes("calculate") ||
        text.includes("algebra") ||
        text.includes("geometry") ||
        text.includes("number")
      ) {
        subject = "Math";
      } else if (
        text.includes("science") ||
        text.includes("biology") ||
        text.includes("chemistry") ||
        text.includes("physics") ||
        text.includes("molecule") ||
        text.includes("atom")
      ) {
        subject = "Science";
      } else if (text.includes("history") || text.includes("war") || text.includes("century") || text.includes("ancient") || text.includes("civilization")) {
        subject = "History";
      } else if (
        text.includes("language") ||
        text.includes("grammar") ||
        text.includes("vocabulary") ||
        text.includes("word") ||
        text.includes("sentence") ||
        text.includes("speak")
      ) {
        subject = "Language";
      } else if (
        text.includes("technology") ||
        text.includes("computer") ||
        text.includes("software") ||
        text.includes("program") ||
        text.includes("code") ||
        text.includes("internet")
      ) {
        subject = "Technology";
      }
    }

    // Save user message with subject
    const userMessage = new Message({
      text: req.body.text,
      isUser: true,
      subject: subject,
    });
    await userMessage.save();

    // Generate AI response with the specified subject
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 15000));

    // Pass the subject to the AI service
    const aiResultPromise = aiService.generateResponse(req.body.text, subject);

    // Race between the AI response and the timeout
    const aiResult = await Promise.race([aiResultPromise, timeoutPromise]).catch((error) => {
      console.error("AI response timed out or failed:", error);
      return {
        response: "I'm sorry, but I couldn't process your request in time. Please try again later.",
      };
    });

    // Save AI response with the same subject
    const aiMessage = new Message({
      text: aiResult.response,
      isUser: false,
      subject: subject,
    });
    await aiMessage.save();

    // Return both messages with subject
    res.status(201).json({
      userMessage,
      aiMessage,
      category: aiResult.category,
    });
  } catch (err) {
    console.error("Error in /api/messages route:", err);
    res.status(400).json({ error: err.message });
  }
});

// CRUD operations for user profiles
app.post("/api/users", async (req, res) => {
  try {
    const user = new UserProfile(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await UserProfile.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const user = await UserProfile.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    await UserProfile.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoints for learning materials
app.post("/api/materials", async (req, res) => {
  try {
    const material = new LearningMaterial(req.body);
    await material.save();
    res.status(201).json(material);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/materials", async (req, res) => {
  try {
    const materials = await LearningMaterial.find();
    res.json(materials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

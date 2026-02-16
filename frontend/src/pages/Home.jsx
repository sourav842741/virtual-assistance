import React, { useContext, useEffect, useRef, useState } from "react";
import { userDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import aiImg from "../assets/ai.gif";
import userImg from "../assets/user.gif";

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } =
    useContext(userDataContext);

  const navigate = useNavigate();

  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");

  const recognitionRef = useRef(null);
  const synth = window.speechSynthesis;

  // ---------------- LOGOUT ----------------
  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, {
        withCredentials: true,
      });
      setUserData(null);
      navigate("/signin");
    } catch (error) {
      console.log(error);
    }
  };

  // ---------------- SPEAK FUNCTION ----------------
  const speak = (text) => {
    if (!text) return;

    console.log("Speaking:", text);

    // Stop listening before speaking
    recognitionRef.current?.stop();

    const utter = new SpeechSynthesisUtterance(text);

    utter.onstart = () => {
      console.log("Speech started");
    };

    utter.onend = () => {
      console.log("Speech ended");

      // Restart listening after speech ends
      setTimeout(() => {
        try {
          recognitionRef.current?.start();
          console.log("Recognition restarted");
        } catch {}
      }, 500);
    };

    utter.onerror = (e) => {
      console.log("Speech error:", e);
    };

    synth.cancel();
    synth.speak(utter);
  };

  // ---------------- HANDLE COMMAND ----------------
  const handleCommand = (data) => {
    if (!data) return;

    const { type, userInput, response } = data;

    if (response) speak(response);

    if (type === "google-search") {
      window.open(
        `https://www.google.com/search?q=${encodeURIComponent(userInput)}`,
        "_blank"
      );
    }

    if (type === "youtube-search" || type === "youtube-play") {
      window.open(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(
          userInput
        )}`,
        "_blank"
      );
    }

    if (type === "calculator-open") {
      window.open(
        `https://www.google.com/search?q=calculator`,
        "_blank"
      );
    }

    if (type === "instagram-open") {
      window.open(`https://www.instagram.com/`, "_blank");
    }

    if (type === "facebook-open") {
      window.open(`https://www.facebook.com/`, "_blank");
    }

    // Spotify open
if (type === "spotify-open") {
  window.open("https://open.spotify.com/", "_blank");
}

// Spotify play
if (type === "spotify-play") {
  const query = encodeURIComponent(userInput);
  window.open(
    `https://open.spotify.com/search/${query}`,
    "_blank"
  );
}


// Gmail
if (type.toLowerCase().includes("gmail")) {
  window.open("https://mail.google.com/", "_blank");
}

// GitHub
if (type.toLowerCase().includes("github")) {
  window.open("https://github.com/", "_blank");
}

// ChatGPT
if (type.toLowerCase().includes("chatgpt")) {
  window.open("https://chat.openai.com/", "_blank");
}


    if (type === "weather-show") {
      window.open(
        `https://www.google.com/search?q=weather`,
        "_blank"
      );
    }
  };

  // ---------------- SPEECH RECOGNITION SETUP ----------------
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.log("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setListening(true);
      console.log("Listening...");
    };

    recognition.onend = () => {
      setListening(false);
      console.log("Recognition stopped");
    };

    recognition.onerror = (event) => {
      console.log("Recognition error:", event.error);
      setListening(false);

      if (event.error === "no-speech") return;
      if (event.error === "network") return;
      if (event.error === "not-allowed") {
        console.log("Mic permission denied");
      }
    };

    recognition.onresult = async (event) => {
      const transcript =
        event.results[event.results.length - 1][0].transcript.trim();

      console.log("User said:", transcript);

      if (
        !transcript
          .toLowerCase()
          .includes(userData?.assistantName?.toLowerCase())
      )
        return;

      setUserText(transcript);
      setAiText("");

      try {
        const data = await getGeminiResponse(transcript);
        handleCommand(data);
        setAiText(data?.response || "");
      } catch (error) {
        console.log(error);
      }

      setUserText("");
    };

    // Start listening only after first user interaction
    const startListening = () => {
      try {
        recognition.start();
      } catch {}
      document.removeEventListener("click", startListening);
    };

    document.addEventListener("click", startListening);

    return () => {
      recognition.stop();
      document.removeEventListener("click", startListening);
    };
  }, [userData]);

  return (
    <div className="w-full h-[100vh] bg-gradient-to-t from-black to-[#02023d] flex justify-center items-center flex-col gap-[15px] overflow-hidden">
      
      <button
        className="absolute top-[20px] right-[20px] bg-white px-4 py-2 rounded-full"
        onClick={handleLogOut}
      >
        Log Out
      </button>

      <div className="w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-3xl shadow-lg">
        <img
          src={userData?.assistantImage}
          alt=""
          className="h-full object-cover"
        />
      </div>

      <h1 className="text-white text-lg font-semibold">
        I'm {userData?.assistantName}
      </h1>

      {!aiText && <img src={userImg} alt="" className="w-[200px]" />}
      {aiText && <img src={aiImg} alt="" className="w-[200px]" />}

      <h1 className="text-white text-lg font-semibold text-center px-4">
        {userText ? userText : aiText ? aiText : ""}
      </h1>

      {/* History */}
      <div className="hidden">
        {userData?.history?.map((his, index) => (
          <div key={index}>{his}</div>
        ))}
      </div>
    </div>
  );
}

export default Home;

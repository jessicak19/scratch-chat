import Head from "next/head";
import { useState, useRef, useEffect } from "react";
import styles from "./index.module.css";

export default function Home() {
  const bottomRef = useRef(null);
  const formRef = useRef(null); // Ref to reference the form element
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);

  //set the first message on load
  useEffect(() => {
    setMessages([{ name: "AI", message: getGreeting() }]);
  }, [0]);

  //scroll to the bottom of the chat for new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function getGreeting() {
    return "Hi, I can help you build a project in Scratch. What are your interests?"
  }


  const buttonClick = (buttonText) => {
    setChatInput(chatInput + buttonText);

  };

  async function onSubmit(event) {
    event.preventDefault();

    //start AI message before call
    //this is a hack, the state doesn't update before the api call,
    //so I reconstruct the messages
    setMessages((prevMessages) => {
      const newMessages = [
        ...prevMessages,
        { name: "Me", message: chatInput },
        { name: "AI", message: "" },
      ];
      return newMessages;
    });

    const sentInput = chatInput;
    setChatInput("");

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat: [...messages, { name: "Me", message: sentInput }],
      }),
    });

    if (!response.ok) {
      alert("Please enter a valid input");
      return;
    }

    const data = response.body;
    if (!data) {
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    //stream in the response
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);

      setMessages((prevMessages) => {
        const lastMsg = prevMessages.pop();
        const newMessages = [
          ...prevMessages,
          { name: lastMsg.name, message: lastMsg.message + chunkValue },
        ];
        return newMessages;
      });
    }
  }

  const messageElements = messages.map((m, i) => {
    return (
      <div
        style={{
          background: m.name === "AI" ? "none" : "rgb(255 190 23 / 20%)",
        }}
        key={i}
        className={styles.message}
      >
        <div className={styles.messageName}>{m.name}</div>
        <div className={styles.messageContent}> {m.message}</div>
      </div>
    );
  });

  return (
    <div>
      <style global jsx>{`
        html,
        body,
        body > div:first-child,
        div#__next,
        div#__next > div {
          height: 100%;
          margin: 0px;
        }
      `}</style>
      <Head>
        <title>Scratch Assistant</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <main className={styles.main}>
        <h3>Scratch Assistant</h3>
        <div className={styles.chat}>
          <div className={styles.chatDisplay}>
            {messageElements}
            <div>
              <button onClick={() => buttonClick("Yes")}>Yes</button>
              <button onClick={() => buttonClick("No")}>No</button>
              <button onClick={() => buttonClick("Help")}>Help</button>
              <button onClick={() => buttonClick("I love it")}>😍</button>
              <button onClick={() => buttonClick("I'm doubtful")}>🤨</button>
              <button onClick={() => buttonClick("I don't like it")}>😢</button>
            </div>
            <div ref={bottomRef} />
          </div>
          <form onSubmit={onSubmit}>
            <input
              type="text"
              name="chat"
              placeholder="Write here"
              value={chatInput}
              onChange={(e) => {
                setChatInput(e.target.value);
              }}
            />
            <input type="submit" value="Submit" />
          </form>
        </div>
      </main>
    </div>
  );
}

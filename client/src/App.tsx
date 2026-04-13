import { useState } from "react";
import "./styles.css";
import { Sidebar } from "./components/SideBar";
import { ApprovalPanel } from "./components/ApprovalPanel";
import AskLLM from "./components/AskLLM";
import AppGenerator from "./components/AppGenerator";
import Test from "./components/TestComponent";
import McpChat from "./components/McpChat";
import Login from "./components/MultiLogin";

export default function App() {
  const [activeTab, setActiveTab] = useState("auth");

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} onSelect={setActiveTab} />

      <main className="main-content">
        {activeTab === "auth" && <Login />}
        {activeTab === "approval" && <ApprovalPanel />}
        {activeTab === "askllm" && <AskLLM />}
        {activeTab === "app-generate" && <AppGenerator />}
        {activeTab === "MCP" && <McpChat />}
        {activeTab === "test" && <Test />}
      </main>
    </div>
  );
}

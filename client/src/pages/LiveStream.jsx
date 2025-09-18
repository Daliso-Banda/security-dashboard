import { useEffect, useRef, useState } from "react";

export default function LiveStream() {
    const [status, setStatus] = useState("offline");
    const [logs, setLogs] = useState([]);
    const imgRef = useRef(null);
    const wsRef = useRef(null);
    const frameQueue = useRef([]);
    const processingRef = useRef(false);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "ws://172.29.180.92:3000";

    useEffect(() => {
        if (wsRef.current) return;

        const ws = new WebSocket(BACKEND_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("[WS] Connected to server");
            setStatus("online");
        };

        ws.onmessage = (event) => {
            try {
                const msg = typeof event.data === "string" ? JSON.parse(event.data) : null;
                if (msg && msg.type === "frame") {
                    // Push frames to queue instead of immediate update
                    frameQueue.current.push(msg.data);
                    requestAnimationFrame(processFrameQueue);
                }
                if (msg && msg.type === "event") {
                    setLogs(prev => [
                        {
                            time: new Date().toLocaleTimeString(),
                            user: msg.user || "Unknown",
                            access: msg.access || "unknown",
                        },
                        ...prev,
                    ]);
                }
            } catch (err) {
                console.error("[WS ERROR] Failed to parse:", err);
            }
        };

        ws.onclose = () => {
            console.warn("[WS] Connection closed");
            setStatus("offline");
            setTimeout(() => {
                wsRef.current = null;
                setStatus("reconnecting...");
            }, 3000);
        };

        ws.onerror = (err) => {
            console.error("[WS] Error:", err);
            setStatus("error");
        };

        const processFrameQueue = () => {
            if (processingRef.current) return;
            processingRef.current = true;

            if (frameQueue.current.length > 0 && imgRef.current) {
                const frameData = frameQueue.current.pop(); // drop old frames, keep latest
                imgRef.current.src = `data:image/jpeg;base64,${frameData}`;
                frameQueue.current = []; // clear queue to avoid backlog
            }

            processingRef.current = false;
        };

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [BACKEND_URL]);

    return (
        <div style={{ padding: "20px" }}>
            <h2>Status: {status}</h2>
            <div style={{ margin: "10px 0" }}>
                <img
                    ref={imgRef}
                    alt="live feed"
                    style={{ width: "400px", border: "1px solid #ccc" }}
                />
            </div>

            <h3>Access Logs</h3>
            <ul style={{ maxHeight: "300px", overflowY: "auto", padding: 0, listStyle: "none" }}>
                {logs.map((log, i) => (
                    <li key={i} style={{ marginBottom: "5px" }}>
                        {log.time} - {log.user} → {log.access}
                    </li>
                ))}
            </ul>
        </div>
    );
}

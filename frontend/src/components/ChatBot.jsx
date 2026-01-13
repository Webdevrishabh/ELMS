/**
 * AI Chatbot Component
 * Smart Leave Assistant
 */

import { useState } from 'react';
import { aiAPI } from '../services/api';
import { MessageCircle, X, Send, Loader, Bot, User } from 'lucide-react';
import './ChatBot.css';

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', content: 'Hi! I\'m your Leave Assistant. Ask me about leave balances, policies, or how to apply for leave!' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const result = await aiAPI.chat(userMessage);
            setMessages(prev => [...prev, {
                role: 'bot',
                content: result.message || 'Sorry, I couldn\'t process that. Please try again.'
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'bot',
                content: 'Sorry, I\'m having trouble connecting. Please try again later.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Chat Toggle Button */}
            <button
                className={`chat-toggle ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <Bot size={20} />
                        <span>Leave Assistant</span>
                        <span className="ai-badge">AI</span>
                    </div>

                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`chat-message ${msg.role}`}>
                                <div className="message-avatar">
                                    {msg.role === 'bot' ? <Bot size={16} /> : <User size={16} />}
                                </div>
                                <div className="message-content">{msg.content}</div>
                            </div>
                        ))}
                        {loading && (
                            <div className="chat-message bot">
                                <div className="message-avatar"><Bot size={16} /></div>
                                <div className="message-content typing">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="chat-input-wrapper">
                        <input
                            type="text"
                            className="chat-input"
                            placeholder="Ask about leaves..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            disabled={loading}
                        />
                        <button
                            className="chat-send"
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                        >
                            {loading ? <Loader size={18} className="spin" /> : <Send size={18} />}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatBot;

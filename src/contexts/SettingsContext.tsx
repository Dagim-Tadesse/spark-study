import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Settings {
    studySessionLength: number;
    newCardTemplate: string;
    newCardTag: string;
}

const DEFAULT_SETTINGS: Settings = {
    studySessionLength: 18,
    newCardTemplate: "Formula",
    newCardTag: "general",
};

interface SettingsContextType {
    settings: Settings;
    updateSettings: (updates: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const [settings, setSettings] = useState<Settings>(() => {
        const saved = localStorage.getItem("spark-study-settings");
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse settings", e);
            }
        }
        return DEFAULT_SETTINGS;
    });

    useEffect(() => {
        localStorage.setItem("spark-study-settings", JSON.stringify(settings));
    }, [settings]);

    const updateSettings = (updates: Partial<Settings>) => {
        setSettings((current) => ({ ...current, ...updates }));
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
};

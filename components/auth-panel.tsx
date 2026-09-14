"use client";

import { LockKeyhole, Waves } from "lucide-react";
import { useState } from "react";
import { signIn, signUp } from "@/app/actions";

type AuthMode = "sign-in" | "sign-up";

const messages: Record<string, string> = {
    exists: "That email is already registered.",
    login: "Email or password is wrong.",
    signup: "Add your name, email, and an 8+ character password.",
};

export function AuthPanel({ error }: { error?: string }) {
    const [mode, setMode] = useState<AuthMode>(error === "signup" || error === "exists" ? "sign-up" : "sign-in");
    const [email, setEmail] = useState("");
    const message = error ? messages[error] : null;
    const tabClass = (tab: AuthMode) =>
        `h-11 rounded-md px-4 text-sm font-bold transition ${
            mode === tab ? "bg-primary text-white" : "text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-950"
        }`;

    return (
        <main className="flex min-h-[calc(100dvh-16rem)] w-full flex-col justify-center bg-background-soft text-zinc-950">
            <section className="mx-auto w-full max-w-md">
                <div className="mb-8">
                    <div className="mb-4 grid size-12 place-items-center rounded-md bg-primary text-white">
                        <Waves className="size-6" />
                    </div>
                    <p className="text-sm text-zinc-500">CoverMe</p>
                    <h1 className="mt-1 text-3xl font-bold tracking-normal">Set up your shift board</h1>
                </div>

                <nav aria-label="Authentication" className="mb-5 grid grid-cols-2 rounded-md bg-zinc-200/70 p-1">
                    <button className={tabClass("sign-in")} onClick={() => setMode("sign-in")} type="button">
                        Login
                    </button>
                    <button className={tabClass("sign-up")} onClick={() => setMode("sign-up")} type="button">
                        Register
                    </button>
                </nav>

                {message ? <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p> : null}

                {mode === "sign-up" ? (
                    <form action={signUp} className="grid gap-3 border-t border-zinc-200 py-5" key="sign-up-form">
                        <input className="field" name="name" placeholder="Full name" required />
                        <input
                            className="field"
                            name="email"
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="Email"
                            required
                            type="email"
                            value={email}
                        />
                        <input className="field" minLength={8} name="password" placeholder="Password" required type="password" />
                        <button className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white">
                            <LockKeyhole className="size-4" />
                            Create account
                        </button>
                    </form>
                ) : (
                    <form action={signIn} className="grid gap-3 border-t border-zinc-200 py-5" key="sign-in-form">
                        <input
                            className="field"
                            name="email"
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="Email"
                            required
                            type="email"
                            value={email}
                        />
                        <input className="field" name="password" placeholder="Password" required type="password" />
                        <button className="h-12 rounded-md border border-primary px-4 text-sm font-semibold text-primary">
                            Sign in
                        </button>
                    </form>
                )}
            </section>
        </main>
    );
}

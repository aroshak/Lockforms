import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 text-center overflow-hidden relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500/20 rounded-full blur-[120px] -z-10 animate-pulse-slow" />

            <div className="space-y-8 animate-fade-in-up">
                <div className="inline-flex items-center px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-4">
                    <ShieldCheck className="w-4 h-4 mr-2 text-primary-400" />
                    <span className="text-xs font-semibold tracking-wider uppercase text-primary-400">Air-Gapped Secure</span>
                </div>

                <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tight text-white leading-tight">
                    The Zero-Trust <br />
                    <span className="text-primary-400 text-glow">
                        Form Builder.
                    </span>
                </h1>

                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Create beautiful, secure forms without your data ever leaving your infrastructure.
                    Enterprise-grade security meets consumer-grade aesthetics.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                    <a href="/admin">
                        <Button size="lg" className="rounded-full px-10 h-14 text-lg group">
                            Enter Console
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </a>
                    <a href="/f/demo">
                        <Button variant="outline" size="lg" className="rounded-full px-10 h-14 text-lg">
                            <Sparkles className="mr-2 w-5 h-5" />
                            Live Demo
                        </Button>
                    </a>
                </div>
            </div>

            <div className="absolute bottom-8 text-sm text-white/20">
                <p>Running in strictly local mode • v0.1.0 Alpha</p>
            </div>
        </main>
    );
}

"use client"

import { useState } from "react"
import { Play } from "lucide-react"

export function VideoSection() {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <section className="py-16 md:py-24 bg-[#111827]">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-white text-center mb-4">
            See How It Works
          </h2>
          <p className="text-gray-400 text-center mb-8 max-w-2xl mx-auto">
            Watch a quick 2-minute overview of how our RPA assessment helps businesses identify automation opportunities
          </p>
          
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#1a2535] border border-white/10">
            {!isPlaying ? (
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Thumbnail placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#00d4a5]/20 to-[#22d3ee]/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <button
                      onClick={() => setIsPlaying(true)}
                      className="group w-20 h-20 rounded-full bg-[#00d4a5] flex items-center justify-center transition-transform hover:scale-110 mb-4"
                    >
                      <Play className="h-8 w-8 text-[#0a1120] ml-1 group-hover:scale-110 transition-transform" />
                    </button>
                    <p className="text-white font-medium">Watch Demo</p>
                    <p className="text-gray-400 text-sm">2 min</p>
                  </div>
                </div>
              </div>
            ) : (
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="RPA Assessment Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

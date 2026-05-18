import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLocation } from "@tanstack/react-router";
import { useApp } from "../AppContext";
import { supabase } from "@/integrations/supabase/client";

export function AnnouncementPopup() {
  const { user } = useApp();
  const location = useLocation();
  const [config, setConfig] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [render, setRender] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if admin is on settings page
    if (user.role === "admin" && location.pathname.includes("/configuracoes")) {
      return;
    }

    (async () => {
      const { data } = await supabase
        .from("announcements")
        .select("config, active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data || !data.active) return;
      const parsed: any = data.config || {};
      if (!parsed.ativo || !parsed.id) return;

      const seenKey = `announcement_seen_${user.id}_${parsed.id}`;
      const sessionKey = `announcement_session_${user.id}_${parsed.id}`;
      const now = new Date();

      let shouldShow = false;

      if (parsed.exibicao === "uma_vez_por_dia") {
        const lastSeen = localStorage.getItem(seenKey);
        if (!lastSeen) {
          shouldShow = true;
        } else {
          const lastSeenDate = new Date(lastSeen).toLocaleDateString("pt-BR");
          const currentDate = now.toLocaleDateString("pt-BR");
          if (lastSeenDate !== currentDate) shouldShow = true;
        }
      } else if (
        parsed.exibicao === "ao_login" ||
        parsed.exibicao === "sempre" ||
        parsed.exibicao === "periodo_especifico"
      ) {
        let withinPeriod = true;
        if (parsed.exibicao === "periodo_especifico") {
          if (parsed.dataInicio && new Date(parsed.dataInicio) > now) withinPeriod = false;
          if (parsed.dataFim) {
            const fim = new Date(parsed.dataFim);
            fim.setHours(23, 59, 59, 999);
            if (fim < now) withinPeriod = false;
          }
        }

        if (withinPeriod) {
          const seenInSession = sessionStorage.getItem(sessionKey);
          if (!seenInSession) shouldShow = true;
        }
      }

      if (shouldShow) {
        setConfig(parsed);
        setRender(true);
        setTimeout(() => setShow(true), 50);
      }
    })();
  }, [user, location.pathname]);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [show]);

  const handleClose = () => {
    if (!config || !user) return;

    const seenKey = `announcement_seen_${user.id}_${config.id}`;
    const sessionKey = `announcement_session_${user.id}_${config.id}`;

    localStorage.setItem(seenKey, new Date().toISOString());
    sessionStorage.setItem(sessionKey, "true");

    setShow(false);
    setTimeout(() => setRender(false), 300); // Wait for transition
  };

  if (!render || !config) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
          show ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Card */}
      <div 
        className={`relative w-full max-w-[600px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[24px] overflow-hidden shadow-2xl transition-all duration-300 ease-out ${
          show ? "opacity-100 scale-100" : "opacity-0 scale-85"
        }`}
      >
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={handleClose}
            className="h-8 w-8 rounded-full bg-black/40 text-white grid place-items-center backdrop-blur-md hover:bg-white hover:text-black transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="absolute top-5 left-6 z-10">
          <span className="text-white/60 font-black uppercase tracking-widest text-xs drop-shadow-md">
            NET TURBO
          </span>
        </div>

        {config.midia && (
          <div className="w-full h-[200px] md:h-[280px] bg-black">
            {config.midia.tipo === "imagem" ? (
              <img src={config.midia.base64} className="w-full h-full object-cover" alt="Anúncio" />
            ) : (
              <video src={config.midia.base64} className="w-full h-full object-cover" muted loop autoPlay playsInline controls />
            )}
          </div>
        )}

        <div className={`p-6 md:p-8 ${!config.midia ? "pt-12 md:pt-16" : ""}`}>
          <h2 className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-tight mb-3 md:mb-4">
            {config.titulo}
          </h2>
          <div className="text-[#AAAAAA] text-sm leading-relaxed whitespace-pre-wrap mb-6 md:mb-8 max-h-[40vh] md:max-h-[30vh] overflow-y-auto custom-scrollbar">
            {config.texto}
          </div>
          <button 
            onClick={handleClose}
            className="w-full bg-[#CCFF00] hover:bg-[#CCFF00]/90 text-black font-black uppercase tracking-widest py-4 rounded-xl text-sm transition-colors"
          >
            Entendido ✓
          </button>
        </div>
      </div>
    </div>
  );
}

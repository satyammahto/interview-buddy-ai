import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInterviewStore } from '@/store/interview-store';
import { supabase } from '@/integrations/supabase/client';
import { Mic, MicOff, Volume2, Loader2, StopCircle, SkipForward } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Interview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const store = useInterviewStore();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentQuestion = store.questions[store.currentQuestionIndex];
  const totalQuestions = store.questions.length;

  // Redirect if no questions
  useEffect(() => {
    if (!store.questions.length) {
      navigate('/setup');
    }
  }, [store.questions, navigate]);

  // Speak question on load/change
  useEffect(() => {
    if (currentQuestion) {
      store.addTranscriptEntry({ role: 'ai', text: currentQuestion.text });
      speakText(currentQuestion.text);
    }
  }, [store.currentQuestionIndex]);

  // Auto-scroll transcript
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [store.transcript]);

  const speakText = async (text: string) => {
    setIsSpeaking(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        // Fallback to browser TTS
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(false);
        speechSynthesis.speak(utterance);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch {
      // Fallback to browser speech synthesis
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  };

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ variant: 'destructive', title: 'Speech recognition not supported in this browser' });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setCurrentTranscript(final);
      setInterimTranscript(interim);
    };

    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech') {
        console.error('Speech recognition error:', e.error);
      }
    };

    recognition.onend = () => {
      // Restart if still listening (browser may stop)
      if (recognitionRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setCurrentTranscript('');
    setInterimTranscript('');
  }, [toast]);

  const stopListening = useCallback(async () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);

    const answerText = (currentTranscript + interimTranscript).trim();
    if (!answerText) {
      toast({ title: 'No answer detected', description: 'Please try again' });
      return;
    }

    store.addTranscriptEntry({ role: 'user', text: answerText });
    setCurrentTranscript('');
    setInterimTranscript('');
    
    // Evaluate
    setIsEvaluating(true);
    try {
      const { data, error } = await supabase.functions.invoke('evaluate-answer', {
        body: {
          question: currentQuestion.text,
          answer: answerText,
          mode: store.mode,
          role: store.targetRole,
          context: store.transcript.slice(-6).map((t) => `${t.role}: ${t.text}`).join('\n'),
        },
      });

      if (error) throw error;

      store.addEvaluation({
        question_id: currentQuestion.id,
        question_text: currentQuestion.text,
        answer_transcript: answerText,
        scores: data.scores,
        feedback: data.feedback,
        follow_up: data.follow_up,
      });

      // Next question or follow-up
      if (data.follow_up && store.currentQuestionIndex < totalQuestions - 1) {
        // Insert follow-up as next question
        const followUpQ = { id: Date.now(), text: data.follow_up, category: 'follow-up' };
        store.addTranscriptEntry({ role: 'ai', text: data.follow_up });
        await speakText(data.follow_up);
      } else if (store.currentQuestionIndex < totalQuestions - 1) {
        store.nextQuestion();
      } else {
        // Interview complete
        store.setInterviewActive(false);
        navigate('/report');
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Evaluation failed', description: err.message });
    } finally {
      setIsEvaluating(false);
    }
  }, [currentTranscript, interimTranscript, currentQuestion, store, navigate, toast, totalQuestions]);

  const skipQuestion = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setCurrentTranscript('');
    setInterimTranscript('');

    if (store.currentQuestionIndex < totalQuestions - 1) {
      store.nextQuestion();
    } else {
      store.setInterviewActive(false);
      navigate('/report');
    }
  };

  const endInterview = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    store.setInterviewActive(false);
    navigate('/report');
  };

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground font-display">
            Question {store.currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <div className="w-32 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${((store.currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={endInterview} className="text-destructive hover:text-destructive">
          <StopCircle className="w-4 h-4 mr-1" /> End Interview
        </Button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Main area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* AI Avatar */}
          <motion.div
            animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="relative mb-8"
          >
            <div className={`w-28 h-28 rounded-full flex items-center justify-center border-2 transition-colors ${
              isSpeaking ? 'bg-primary/10 border-primary' : isEvaluating ? 'bg-accent/10 border-accent' : 'bg-secondary border-border'
            }`}>
              {isSpeaking ? (
                <Volume2 className="w-10 h-10 text-primary" />
              ) : isEvaluating ? (
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted-foreground/20" />
              )}
            </div>
            {isSpeaking && (
              <div className="absolute inset-0 w-28 h-28 rounded-full border-2 border-primary/30 animate-pulse-ring" />
            )}
          </motion.div>

          {/* Current question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center max-w-lg mb-8"
            >
              <span className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                {currentQuestion.category}
              </span>
              <p className="text-xl font-display font-medium leading-relaxed">{currentQuestion.text}</p>
            </motion.div>
          </AnimatePresence>

          {/* Live transcript */}
          {(isListening || currentTranscript) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="glass rounded-xl p-4 max-w-lg w-full mb-6"
            >
              <p className="text-sm text-muted-foreground mb-1">Your answer:</p>
              <p className="text-sm">
                {currentTranscript}
                <span className="text-muted-foreground">{interimTranscript}</span>
                {isListening && <span className="animate-pulse ml-1">|</span>}
              </p>
            </motion.div>
          )}

          {/* Controls */}
          <div className="flex gap-3">
            {!isListening ? (
              <Button
                size="lg"
                onClick={startListening}
                disabled={isSpeaking || isEvaluating}
                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 glow font-display px-8 py-6"
              >
                <Mic className="w-5 h-5 mr-2" />
                {isEvaluating ? 'Evaluating...' : isSpeaking ? 'Listening to AI...' : 'Start Answering'}
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={stopListening}
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-display px-8 py-6"
              >
                <MicOff className="w-5 h-5 mr-2" /> Done Answering
              </Button>
            )}
            <Button variant="outline" size="lg" onClick={skipQuestion} className="rounded-xl px-6 py-6">
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Transcript sidebar */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border">
          <div className="p-4 border-b border-border">
            <h3 className="font-display font-semibold text-sm">Transcript</h3>
          </div>
          <ScrollArea className="h-[300px] lg:h-[calc(100vh-120px)]">
            <div className="p-4 space-y-3">
              {store.transcript.map((entry, i) => (
                <div key={i} className={`text-sm ${entry.role === 'ai' ? 'text-primary' : 'text-foreground'}`}>
                  <span className="text-xs text-muted-foreground uppercase">{entry.role === 'ai' ? 'Interviewer' : 'You'}</span>
                  <p className="mt-0.5 leading-relaxed">{entry.text}</p>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default Interview;

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useInterviewStore } from '@/store/interview-store';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { RotateCcw, Share2, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, ChevronLeft } from 'lucide-react';
import { useState } from 'react';

const dimensionLabels: Record<string, string> = {
  technical_knowledge: 'Technical',
  communication: 'Communication',
  problem_solving: 'Problem Solving',
  confidence: 'Confidence',
  relevance: 'Relevance',
};

const Report = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const store = useInterviewStore();
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  const aggregateScores = useMemo(() => {
    if (!store.evaluations.length) return null;
    const dims = ['technical_knowledge', 'communication', 'problem_solving', 'confidence', 'relevance'] as const;
    const totals = dims.map((dim) => {
      const avg = store.evaluations.reduce((sum, e) => sum + (e.scores[dim] || 0), 0) / store.evaluations.length;
      return { dimension: dimensionLabels[dim], score: Math.round(avg * 10) / 10, fullMark: 10 };
    });
    return totals;
  }, [store.evaluations]);

  const overallScore = useMemo(() => {
    if (!aggregateScores) return 0;
    return Math.round(aggregateScores.reduce((s, d) => s + d.score, 0) * 10) / 10;
  }, [aggregateScores]);

  const strengths = useMemo(() => {
    if (!aggregateScores) return [];
    return [...aggregateScores].sort((a, b) => b.score - a.score).slice(0, 2);
  }, [aggregateScores]);

  const weaknesses = useMemo(() => {
    if (!aggregateScores) return [];
    return [...aggregateScores].sort((a, b) => a.score - b.score).slice(0, 2);
  }, [aggregateScores]);

  if (!store.evaluations.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold mb-4">No Interview Data</h1>
          <p className="text-muted-foreground mb-6">Complete an interview first to see your report.</p>
          <Button onClick={() => navigate('/setup')} className="bg-primary text-primary-foreground rounded-xl">
            Start Interview
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 relative">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => { store.reset(); navigate('/'); }} 
        className="absolute top-4 left-4 sm:top-8 sm:left-8 rounded-full"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>

      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">Interview Report</h1>
          <p className="text-muted-foreground mb-8">
            {store.targetRole} · {store.mode} · {store.difficulty} level
          </p>
        </motion.div>

        {/* Overall Score + Radar */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="glass rounded-2xl h-full">
              <CardContent className="p-8 flex flex-col items-center justify-center h-full">
                <p className="text-sm text-muted-foreground mb-2 font-display">Overall Score</p>
                <div className="text-6xl font-display font-bold text-gradient mb-2">{overallScore}</div>
                <p className="text-muted-foreground text-sm">out of 50</p>
                <div className="w-full h-2 rounded-full bg-secondary mt-6 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-1000"
                    style={{ width: `${(overallScore / 50) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass rounded-2xl h-full">
              <CardContent className="p-4">
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={aggregateScores || []}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {strengths.map((s) => (
                  <div key={s.dimension} className="flex justify-between items-center">
                    <span className="text-sm">{s.dimension}</span>
                    <span className="text-sm font-medium text-primary">{s.score}/10</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card className="glass rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-accent" /> Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {weaknesses.map((w) => (
                  <div key={w.dimension} className="flex justify-between items-center">
                    <span className="text-sm">{w.dimension}</span>
                    <span className="text-sm font-medium text-accent">{w.score}/10</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Per-question breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 className="font-display text-xl font-semibold mb-4">Question Breakdown</h2>
          <div className="space-y-3">
            {store.evaluations.map((ev, i) => (
              <Card
                key={ev.question_id}
                className="glass rounded-xl cursor-pointer hover:border-primary/20 transition-colors"
                onClick={() => setExpandedQ(expandedQ === i ? null : i)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">Q{i + 1}: {ev.question_text}</p>
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(ev.scores).map(([k, v]) => (
                          <span key={k} className="text-xs px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
                            {dimensionLabels[k]}: {v}
                          </span>
                        ))}
                      </div>
                    </div>
                    {expandedQ === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  {expandedQ === i && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-border space-y-3"
                    >
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Your Answer</p>
                        <p className="text-sm">{ev.answer_transcript}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">AI Feedback</p>
                        <p className="text-sm text-primary">{ev.feedback}</p>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-4 mt-10 justify-center"
        >
          <Button
            size="lg"
            onClick={() => { store.reset(); navigate('/setup'); }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 glow rounded-xl font-display px-8 py-6"
          >
            <RotateCcw className="w-5 h-5 mr-2" /> Try Again
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              navigator.clipboard.writeText(
                `I scored ${overallScore}/50 on my ${store.mode} interview practice for ${store.targetRole}!`
              );
              toast({ title: 'Copied to clipboard!' });
            }}
            className="rounded-xl font-display px-8 py-6"
          >
            <Share2 className="w-5 h-5 mr-2" /> Share Results
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Report;

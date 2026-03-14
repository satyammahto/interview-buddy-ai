import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useInterviewStore, InterviewMode, Difficulty } from '@/store/interview-store';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Code, Users, Heart, Flame, ArrowRight, Loader2, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const modes: { id: InterviewMode; label: string; icon: typeof Code; description: string }[] = [
  { id: 'technical', label: 'Technical', icon: Code, description: 'DSA, system design, coding' },
  { id: 'behavioral', label: 'Behavioral', icon: Users, description: 'STAR method, teamwork, leadership' },
  { id: 'hr', label: 'HR', icon: Heart, description: 'Culture fit, salary, situational' },
  { id: 'stress', label: 'Stress', icon: Flame, description: 'Pressure scenarios, rapid-fire' },
];

const difficulties: { id: Difficulty; label: string }[] = [
  { id: 'junior', label: 'Junior' },
  { id: 'mid', label: 'Mid-Level' },
  { id: 'senior', label: 'Senior' },
];

const Setup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const store = useInterviewStore();
  const [file, setFile] = useState<File | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [resumeParsed, setResumeParsed] = useState(false);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === 'application/pdf') {
      setFile(dropped);
      setResumeParsed(false);
    } else {
      toast({ variant: 'destructive', title: 'Please upload a PDF file' });
    }
  }, [toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResumeParsed(false);
    }
  }, []);

  const parseResume = async () => {
    if (!file) return;
    setIsParsingResume(true);
    try {
      const reader = new FileReader();
      const text = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('parse-resume', {
        body: { file_base64: text, filename: file.name },
      });

      if (error) throw error;
      store.setResumeData(data);
      setResumeParsed(true);
      toast({ title: 'Resume parsed!', description: `Found ${data.skills?.length || 0} skills` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Failed to parse resume', description: err.message });
    } finally {
      setIsParsingResume(false);
    }
  };

  const startInterview = async () => {
    if (!store.targetRole) {
      toast({ variant: 'destructive', title: 'Please enter a target role' });
      return;
    }
    setIsGeneratingQuestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-questions', {
        body: {
          skills: store.resumeData?.skills || [],
          role: store.targetRole,
          mode: store.mode,
          difficulty: store.difficulty,
          experience: store.resumeData?.experience_level || 'unknown',
        },
      });

      if (error) throw error;
      store.setQuestions(data.questions);
      store.setInterviewActive(true);
      navigate('/interview');
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Failed to generate questions', description: err.message });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 relative">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => navigate('/')} 
        className="absolute top-4 left-4 sm:top-8 sm:left-8 rounded-full"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>

      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">Set Up Your Interview</h1>
          <p className="text-muted-foreground mb-10">Upload your resume, pick your mode, and let's go.</p>
        </motion.div>

        {/* Resume Upload */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Label className="text-sm font-medium mb-3 block font-display">Resume (PDF)</Label>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="glass rounded-2xl p-8 text-center cursor-pointer hover:border-primary/30 transition-colors mb-2"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input id="file-input" type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Drop your PDF here or click to browse</p>
              </>
            )}
          </div>
          {file && !resumeParsed && (
            <Button onClick={parseResume} disabled={isParsingResume} variant="outline" className="mt-2 w-full">
              {isParsingResume ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Parsing...</> : 'Parse Resume with AI'}
            </Button>
          )}
          {resumeParsed && store.resumeData && (
            <div className="mt-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium text-primary mb-1">Skills extracted:</p>
              <div className="flex flex-wrap gap-1.5">
                {store.resumeData.skills.slice(0, 12).map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs">{s}</span>
                ))}
                {store.resumeData.skills.length > 12 && (
                  <span className="text-xs text-muted-foreground">+{store.resumeData.skills.length - 12} more</span>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Target Role */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8">
          <Label className="text-sm font-medium mb-3 block font-display">Target Role</Label>
          <Input
            placeholder="e.g. Senior Frontend Engineer"
            value={store.targetRole}
            onChange={(e) => store.setTargetRole(e.target.value)}
            className="bg-secondary/50 border-border h-12 rounded-xl text-base"
          />
        </motion.div>

        {/* Interview Mode */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8">
          <Label className="text-sm font-medium mb-3 block font-display">Interview Mode</Label>
          <div className="grid grid-cols-2 gap-3">
            {modes.map((m) => (
              <Card
                key={m.id}
                onClick={() => store.setMode(m.id)}
                className={`cursor-pointer transition-all rounded-xl ${
                  store.mode === m.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'glass hover:border-muted-foreground/30'
                }`}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <m.icon className={`w-5 h-5 mt-0.5 ${store.mode === m.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-medium text-sm">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Difficulty */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8">
          <Label className="text-sm font-medium mb-3 block font-display">Difficulty Level</Label>
          <div className="flex gap-3">
            {difficulties.map((d) => (
              <Button
                key={d.id}
                variant={store.difficulty === d.id ? 'default' : 'outline'}
                onClick={() => store.setDifficulty(d.id)}
                className={`flex-1 rounded-xl ${store.difficulty === d.id ? 'bg-primary text-primary-foreground' : ''}`}
              >
                {d.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Start */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-10">
          <Button
            size="lg"
            onClick={startInterview}
            disabled={isGeneratingQuestions || !store.targetRole}
            className="w-full text-lg py-6 bg-primary text-primary-foreground hover:bg-primary/90 glow rounded-xl font-display font-semibold"
          >
            {isGeneratingQuestions ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Generating Questions...</>
            ) : (
              <>Start Interview <ArrowRight className="ml-2 w-5 h-5" /></>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-3">Resume upload is optional — you can skip it.</p>
        </motion.div>
      </div>
    </div>
  );
};

export default Setup;

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mic, Brain, BarChart3, Zap, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: Mic,
    title: 'AI Voice Interviewer',
    description: 'Realistic voice conversations powered by ElevenLabs — feels like a real interview.',
  },
  {
    icon: Brain,
    title: 'Smart Questions',
    description: 'AI reads your resume and generates role-specific questions that adapt to your answers.',
  },
  {
    icon: BarChart3,
    title: 'Instant Feedback',
    description: 'Get scored across 5 dimensions with detailed improvement suggestions after every session.',
  },
  {
    icon: Zap,
    title: 'Multiple Modes',
    description: 'Technical, behavioral, HR, or stress — practice the exact interview style you need.',
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative z-10 max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-border bg-secondary/50 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            AI-Powered Interview Practice
          </div>

          <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Practice interviews with{' '}
            <span className="text-gradient">AI that talks back</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your resume, choose your interview style, and have a realistic voice conversation 
            with an AI interviewer. Get scored and improve — in minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/setup')}
              className="text-lg px-8 py-6 bg-primary text-primary-foreground hover:bg-primary/90 glow rounded-xl font-display font-semibold"
            >
              Start Interview
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-lg px-8 py-6 rounded-xl font-display"
            >
              See How It Works
            </Button>
          </div>
        </motion.div>

        {/* Floating mic icon */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="absolute bottom-20 animate-float"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <Mic className="w-7 h-7 text-primary" />
            </div>
            <div className="absolute inset-0 w-16 h-16 rounded-full border border-primary/30 animate-pulse-ring" />
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Everything you need to <span className="text-gradient">ace your interview</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Built for job seekers who want to practice with something smarter than a mirror.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-8 hover:border-primary/30 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center glass rounded-3xl p-12 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Ready to practice?</h2>
            <p className="text-muted-foreground text-lg mb-8">No signup required. Just upload your resume and start.</p>
            <Button
              size="lg"
              onClick={() => navigate('/setup')}
              className="text-lg px-8 py-6 bg-primary text-primary-foreground hover:bg-primary/90 glow rounded-xl font-display font-semibold"
            >
              Start Your Interview
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Index;

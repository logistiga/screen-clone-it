import { motion } from "framer-motion";
import { Check, Container, Users, FileText, Eye, Ship, Package, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrdreStepperProps {
  currentStep: number;
  categorie?: string;
  onStepClick?: (step: number) => void;
}

const steps = [
  { id: 1, name: "Catégorie", icon: Container, description: "Type d'ordre" },
  { id: 2, name: "Client", icon: Users, description: "Sélection client" },
  { id: 3, name: "Détails", icon: FileText, description: "Informations" },
  { id: 4, name: "Récapitulatif", icon: Eye, description: "Vérification" },
];

export function OrdreStepper({ currentStep, categorie, onStepClick }: OrdreStepperProps) {
  const getCategorieIcon = () => {
    switch (categorie) {
      case "conteneurs":
        return <Container className="h-4 w-4" />;
      case "conventionnel":
        return <Ship className="h-4 w-4" />;
      case "operations_independantes":
        return <Truck className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-between">
        {steps.map((step, stepIdx) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const StepIcon = step.icon;

          return (
            <li key={step.name} className="relative flex-1">
              {stepIdx !== steps.length - 1 && (
                <div
                  className="absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-0.5 bg-muted"
                  aria-hidden="true"
                >
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: isCompleted ? "100%" : "0%" }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => onStepClick?.(step.id)}
                disabled={step.id > currentStep + 1}
                className={cn(
                  "group flex flex-col items-center relative z-10",
                  step.id > currentStep + 1 && "cursor-not-allowed opacity-50"
                )}
              >
                <motion.span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-200",
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCurrent
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted bg-background text-muted-foreground"
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : step.id === 1 && categorie ? (
                    getCategorieIcon()
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </motion.span>
                <span
                  className={cn(
                    "mt-2 text-sm font-medium transition-colors duration-200",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {step.name}
                </span>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

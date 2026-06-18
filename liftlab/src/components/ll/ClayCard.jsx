import { cn } from "@/lib/utils";
/** Claymorphism container — product cards, class schedule chips, supplement tiles */
export function ClayCard({ children, className, ...props }) {
    return (<div className={cn("clay p-5", className)} {...props}>
      {children}
    </div>);
}

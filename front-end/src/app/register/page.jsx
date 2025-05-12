import { RegisterForm } from "@/components/form/register-form";

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center text-xl tracking-wide">
          <div className="flex h-8 w-8 items-center justify-center rounded-md text-primary-foreground">
            <img src="/misred-logo.png" alt="" />
          </div>
          Misred-Sparing
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}

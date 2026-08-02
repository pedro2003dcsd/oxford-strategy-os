import { ScoutChat } from "@/components/ScoutChat";

export const metadata = {
  title: "Scout AI · Oxford Strategy OS",
};

export default function ScoutPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Scout AI</h1>
        <p className="text-sm text-neutral-500">
          Preguntale en lenguaje natural por el estado de los OKRs, los check-ins
          de la semana y la rentabilidad de los proyectos.
        </p>
      </div>
      <ScoutChat variant="page" />
    </div>
  );
}

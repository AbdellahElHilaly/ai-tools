import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Play, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { quizRepository } from "../modules/quiz/services/quizRepository";
import { Button } from "../shared/components/Button";
import { Card } from "../shared/components/Card";
import { EmptyState, ErrorNotice, LoadingState } from "../shared/components/Feedback";

export function LibraryPage() {
  const queryClient = useQueryClient();
  const quizzes = useQuery({ queryKey: ["quizzes"], queryFn: () => quizRepository.list() });
  const remove = useMutation({
    mutationFn: (id) => quizRepository.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quizzes"] })
  });

  if (quizzes.isLoading) return <div className="page"><LoadingState label="Loading your quizzes…" /></div>;
  if (!quizzes.data?.length) return (
    <div className="page stack gap-6"><header><span className="eyebrow">Quiz</span><h1 className="page-title">My quizzes</h1></header><EmptyState icon={BookOpen} title="Your library is empty" description="Create your first quiz, then return here to continue at any level." action={<Link to="/quiz"><Button>Create a quiz</Button></Link>} /></div>
  );

  return (
    <div className="page stack gap-6">
      <header><span className="eyebrow">Quiz</span><h1 className="page-title">My quizzes</h1><p className="page-copy">Your saved learning paths, ordered by most recent activity.</p></header>
      {quizzes.isError ? <ErrorNotice>We could not refresh your account library. Showing the local copy instead.</ErrorNotice> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {quizzes.data.map((quiz) => {
          const progressEntries = Object.values(quiz.progressByLevel || {});
          const session = progressEntries.find((item) => item.status === "active") || quiz.currentSession;
          const total = session?.questions?.length || 0;
          const done = session?.answers?.length || 0;
          const completedLevels = progressEntries.filter((item) => item.status === "completed").length;
          return (
            <Card key={quiz.id} className="stack">
              <div><span className="eyebrow">{session?.levelTitle || "Ready to begin"}</span><h2 className="mb-2 mt-2 text-xl font-black">{quiz.title}</h2><p className="muted m-0 line-clamp-2 leading-7">{quiz.description}</p></div>
              <p className="m-0 text-sm font-bold text-brand">{completedLevels}/{quiz.plan.levels.length} levels complete</p>
              {total ? <div><div className="mb-2 flex justify-between text-xs font-bold"><span>Progress</span><span>{done}/{total}</span></div><div className="h-2 overflow-hidden rounded-full bg-accent"><span className="block h-full rounded-full bg-brand" style={{ width: `${Math.round((done / total) * 100)}%` }} /></div></div> : null}
              <div className="cluster mt-auto">
                <Link className="flex-1" to={`/quiz?id=${quiz.id}`}><Button className="w-full"><Play size={17} /> {done ? "Continue" : "Start"}</Button></Link>
                <Button variant="danger" aria-label={`Delete ${quiz.title}`} onClick={() => remove.mutate(quiz.id)}><Trash2 size={17} /></Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

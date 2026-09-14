import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Play, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { quizRepository } from "../modules/quiz/services/quizRepository";
import { Button } from "../shared/components/Button";
import { Card } from "../shared/components/Card";
import { EmptyState, LoadingState } from "../shared/components/Feedback";

export function LibraryPage() {
  const queryClient = useQueryClient();
  const quizzes = useQuery({ queryKey: ["quizzes"], queryFn: () => quizRepository.list() });
  const remove = useMutation({
    mutationFn: (id) => quizRepository.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quizzes"] })
  });

  if (quizzes.isLoading) return <div className="page"><LoadingState label="كنجيب الكويزات ديالك…" /></div>;
  if (!quizzes.data?.length) return (
    <div className="page stack gap-6"><header><span className="eyebrow">Library</span><h1 className="page-title">مكتبتي</h1></header><EmptyState icon={BookOpen} title="المكتبة مازالت فارغة" description="صايب أول Quiz، وغادي تلقاه هنا باش تكمل من نفس المستوى." action={<Link to="/quiz"><Button>صايب أول Quiz</Button></Link>} /></div>
  );

  return (
    <div className="page stack gap-6">
      <header><span className="eyebrow">Library</span><h1 className="page-title">مكتبتي</h1><p className="page-copy">كل ما حفظتيه، مرتب حسب آخر استعمال.</p></header>
      <div className="grid gap-4 sm:grid-cols-2">
        {quizzes.data.map((quiz) => {
          const session = quiz.currentSession;
          const total = session?.questions?.length || 0;
          const done = session?.answers?.length || 0;
          return (
            <Card key={quiz.id} className="stack">
              <div><span className="eyebrow">{session?.levelTitle || "جاهز للبداية"}</span><h2 className="mb-2 mt-2 text-xl font-black">{quiz.title}</h2><p className="muted m-0 line-clamp-2 leading-7">{quiz.description}</p></div>
              {total ? <div><div className="mb-2 flex justify-between text-xs font-bold"><span>التقدم</span><span>{done}/{total}</span></div><div className="h-2 overflow-hidden rounded-full bg-black/5"><span className="block h-full rounded-full bg-brand" style={{ width: `${Math.round((done / total) * 100)}%` }} /></div></div> : null}
              <div className="cluster mt-auto">
                <Link className="flex-1" to={`/quiz?id=${quiz.id}`}><Button className="w-full"><Play size={17} /> {done ? "كمّل" : "ابدأ"}</Button></Link>
                <Button variant="danger" aria-label={`حذف ${quiz.title}`} onClick={() => remove.mutate(quiz.id)}><Trash2 size={17} /></Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { Button } from "../shared/components/Button";

export function NotFoundPage() {
  return <div className="page grid min-h-[60vh] place-items-center text-center"><div className="stack"><h1 className="page-title">الصفحة غير موجودة</h1><Link to="/"><Button>رجوع للرئيسية</Button></Link></div></div>;
}

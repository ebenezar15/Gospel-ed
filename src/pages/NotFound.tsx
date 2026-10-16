import { Link } from 'react-router-dom';
export default function NotFound() {
  return <div className="py-20 text-center"><h1 className="text-5xl mb-3">Off the map</h1><p className="text-muted font-serif mb-6">This page isn’t in the atlas.</p><Link className="btn btn-primary" to="/">Back to the beginning</Link></div>;
}

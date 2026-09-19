import { redirect } from 'next/navigation';

export default function WrappedRedirect() {
  redirect('/blog/wrapped');
}

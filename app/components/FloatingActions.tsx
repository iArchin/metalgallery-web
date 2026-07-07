import ScrollToTop from "./ScrollToTop";
import LiveChat from "./LiveChat";

export default function FloatingActions({
  phone,
  email,
}: {
  phone?: string;
  email?: string;
}) {
  return (
    <>
      <ScrollToTop />
      <LiveChat phone={phone} email={email} />
    </>
  );
}

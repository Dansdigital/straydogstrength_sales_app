import PageHeader from "../components/global/PageHeader";

export default function DefaultPageTemplate({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full p-6">
      <PageHeader title={title} description={description} />
      {children}
    </div>
  );
}

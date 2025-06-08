interface PageHeaderProps {
  title: string;
  description?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description }) => (
  <div>
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
    <p className="text-gray-600 mb-6">{description}</p>
  </div>
);

export default PageHeader;

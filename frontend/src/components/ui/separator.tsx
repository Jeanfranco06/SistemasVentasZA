type SeparatorProps = React.HTMLAttributes<HTMLHRElement>;

export const Separator = ({ className = '', ...props }: SeparatorProps) => {
  return <hr className={`my-2 border-gray-200 ${className}`} {...props} />;
};

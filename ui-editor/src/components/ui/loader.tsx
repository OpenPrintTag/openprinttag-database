import { cn } from '~/lib/utils';

type LoaderSize = 'sm' | 'md' | 'lg' | 'xl';

type LoaderProps = {
  size?: LoaderSize;
  className?: string;
};

const sizeConfig: Record<LoaderSize, string> = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-40 h-40',
  xl: 'w-56 h-56',
};

export const Loader = ({ size = 'md', className }: LoaderProps) => (
  <div className={cn('flex items-center justify-center', className)}>
    <img
      src="/nfc-tag.png"
      className={sizeConfig[size]}
      style={{ animation: 'loader-breathe 2s ease-in-out infinite' }}
    />
  </div>
);

export const PageLoader = () => (
  <div className="flex min-h-[400px] w-full items-center justify-center">
    <Loader size="lg" />
  </div>
);

export const InlineLoader = () => (
  <div className="flex items-center justify-center py-4">
    <Loader size="sm" />
  </div>
);

export const OverlayLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
    <Loader size="xl" />
  </div>
);

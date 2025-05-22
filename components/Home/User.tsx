import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { useAccount } from "wagmi";
import Image from "next/image";

export function User() {
  const { context } = useMiniAppContext();
  const { address } = useAccount();

  return (
    <div className="absolute top-4 right-4 flex flex-col items-center space-y-2">
      {context?.user?.pfpUrl && (
        <Image
          src={context.user.pfpUrl}
          alt="Profile"
          className="w-20 h-20 rounded-full"
          width={25}
          height={25}
        />
      )}
      <div className="text-center">
        {context?.user?.username && (
          <p className="text-sm text-muted-foreground">
            @{context.user.username}
          </p>
        )}
      </div>
    </div>
  );
}
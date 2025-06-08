interface MessageProps {
  // user: string;
  message: string;
  avatar?: string;
  status?: string;
  toLeft?: boolean;
  date?: string;
  isUpdated?: string;
  lprEventType?: (Read | null | undefined)[] | null;
  onLPRClick?: (arg0: (Read | null | undefined)[], arg1: number) => void;
  recentEdit?: string;
}

interface Read {
  Name: string;
  Image: string;
  Plate: string;
  State: string;
  Make: string;
  Model: string;
  Color: string;
  Year: string;

  Timestamp: string;
}

const MessageBox = ({
  // user,
  message,
  avatar,
  status,
  date,
  toLeft = true,
  lprEventType,
  recentEdit,
  onLPRClick,
}: MessageProps) => {
  function displayLPR() {
    if (lprEventType) {
      if (lprEventType.length <= 4) {
        return (
          <div className="grid gap-4 grid-cols-2 my-2.5">
            {onLPRClick &&
              lprEventType.map((event, index) => (
                <div className="group relative">
                  <div className="absolute w-full h-full bg-gray-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                    <button
                      onClick={() => onLPRClick(lprEventType, index)}
                      className="inline-flex items-center justify-center rounded-full h-8 w-8 bg-white/30 hover:bg-white/50 focus:ring-4 focus:outline-none focus:ring-gray-50"
                    >
                      <svg
                        className="w-4 h-4 text-[var(--primary)]"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 16 18"
                      >
                        <path
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 1v11m0 0 4-4m-4 4L4 8m11 4v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3"
                        />
                      </svg>
                    </button>
                  </div>

                  <img src={event?.Image} className="rounded-lg" />
                </div>
              ))}
          </div>
        );
      } else {
        const firstLPREvents = lprEventType.slice(0, 3);
        return (
          onLPRClick && (
            <div className="grid gap-4 grid-cols-2 my-2.5">
              {firstLPREvents.map(
                (event, index) =>
                  event?.Image &&
                  event.Name && (
                    <div key={index} className="group relative">
                      <div className="absolute w-full h-full bg-gray-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                        <button
                          onClick={() => onLPRClick(lprEventType, index)}
                          className="inline-flex items-center justify-center rounded-full h-8 w-8 bg-white/30 hover:bg-white/50 focus:ring-4 focus:outline-none focus:ring-gray-50"
                        >
                          <svg
                            className="w-4 h-4 text-white"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 16 18"
                          >
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 1v11m0 0 4-4m-4 4L4 8m11 4v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3"
                            />
                          </svg>
                        </button>
                      </div>

                      <img src={event?.Image || ""} className="rounded-lg" />
                    </div>
                  ),
              )}
              <div className="group relative">
                <button
                  onClick={() => onLPRClick(lprEventType, 3)}
                  className="absolute w-full h-full bg-gray-900/90 hover:bg-gray-900/50 transition-all duration-300 rounded-lg flex items-center justify-center"
                >
                  <span className="text-xl font-medium text-white">
                    +{lprEventType.length - 3}
                  </span>
                </button>
                <img src={lprEventType[3]?.Image} className="rounded-lg" />
              </div>
            </div>
          )
        );
      }
    }
  }

  return (
    <div
      className={`flex mx-2 items-start space-x-2 ${toLeft ? "" : "flex-row-reverse space-x-reverse "}`}
    >
      <img
        className="w-8 h-8 rounded-full mt-1"
        src={avatar}
        alt="User avatar"
      />

      <div
        className={`rounded-lg ${toLeft ? "rounded-tl-none" : "rounded-tr-none"} flex flex-col w-full max-w-[320px] leading-1.5 p-4  whitespace-pre-wrap break-words bg-[var(--chat-bubble1)]`}
      >
        <div className="text-md font-normal text-white">{message}</div>

        {displayLPR()}
        <div className="flex flex-col justify-start text-white ">
          <span className="text-xs mt-1 font-normal">{date}</span>
          {recentEdit && (
            <span className="italic text-xs mt-1 font-normal">
              {recentEdit}
            </span>
          )}
          <span className="text-sm font-bold">
            {status ? status : "Unknown"}
          </span>
        </div>
      </div>
      <button
        id="dropdownMenuIconButton"
        data-dropdown-toggle="dropdownDots"
        data-dropdown-placement="bottom-start"
        className="inline-flex self-center items-center p-2 text-sm font-medium text-center text-gray-900 bg-white rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none dark:text-white focus:ring-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:ring-gray-600"
        type="button"
      >
        <svg
          className="w-4 h-4 "
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 4 15"
        >
          <path d="M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6.041a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5.959a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
        </svg>
      </button>
    </div>
  );
};

export default MessageBox;

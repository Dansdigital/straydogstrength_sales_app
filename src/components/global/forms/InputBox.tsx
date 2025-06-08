import { useState, useRef, useEffect } from "react";
import { IoAddCircleSharp } from "react-icons/io5";

interface InputBoxProps {
  title?: string;
  innerText?: string;
  value?: string;
  onChange?: (value: string) => void;
  onEnter?: () => void;
  onAdd?: {
    itemName: string;
    onClick: () => void;
  }[];
}

const InputBox = ({
  title = "",
  innerText = "",
  value,
  onChange,
  onEnter,
  onAdd,
}: InputBoxProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [isAddButtonopen, setAddButtonOpen] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
    onChange?.(event.target.value);
  };

  const sliderRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      sliderRef.current &&
      !sliderRef.current.contains(event.target as Node)
    ) {
      setAddButtonOpen(false);
    }
  };

  const onKeyPress = (inputKey: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (onEnter && inputKey.code == "Enter" && !inputKey.shiftKey) {
      inputKey.stopPropagation();
      inputKey.preventDefault();
      onEnter();
      setInputValue("");
    }
  };

  useEffect(() => {
    if (isAddButtonopen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAddButtonopen]);

  return (
    <h1 ref={sliderRef} className="text-[var(--primary)]">
      <label htmlFor="InputBox" className="block text-sm font-medium">
        {title}
      </label>
      <div className="relative mt-1">
        {onAdd && isAddButtonopen && (
          <div
            className="flex flex-col place-content-center border border-[var(--border-color)] px-2 py-2 rounded bottom-0 absolute -translate-y-10 z-30  truncate bg-[var(--pop-up)]"
            onClick={() => setAddButtonOpen(false)}
          >
            {onAdd.map((item) => (
              <li
                className="border px-2 border-[var(--border-color)] rounded"
                style={{ cursor: "pointer" }}
                key={item.itemName}
                onClick={item.onClick}
              >
                {item.itemName}
              </li>
            ))}
          </div>
        )}
        {onAdd && (
          <button onClick={() => setAddButtonOpen(!isAddButtonopen)}>
            <IoAddCircleSharp className="absolute left-2 top-1/2 -translate-y-1/2 text-3xl" />
          </button>
        )}
        <textarea
          id="InputBox"
          className={` ${onAdd ? "pl-10" : "pl-3"} ${onEnter ? "pr-[85px]" : "pr-3"} peer w-full rounded-md border border-[var(--border-color)] bg-[var(--input-box)] py-2  placeholder-transparent shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600`}
          placeholder="Placeholder"
          value={inputValue} // Bind input value to state
          onChange={handleChange} // Update state on user input
          onKeyDown={(inputKey) => onKeyPress(inputKey)}
          rows={1}
        />
        <span
          className={`${inputValue ? "hidden" : ""} ${onAdd ? "px-8" : "px-1"} pointer-events-none absolute left-3 top-1/2 -translate-y-1/2  text-xs text-[var(--primary)] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:text-xs`}
        >
          {innerText}
        </span>
        {onEnter && (
          <button
            // key={index}
            // onClick={() => action.onClick(row)}
            onClick={() => {
              onEnter();
              setInputValue("");
            }}
            className="absolute rounded right-1 top-1/2 -translate-y-[53%] justify-center rounded-md bg-[var(--button)] text-[var(--button-text)] hover:bg-[var(--button-hover)] px-3 py-2 text-sm font-semibold shadow-sm"
          >
            Enter
          </button>
        )}
      </div>
    </h1>
  );
};

export default InputBox;

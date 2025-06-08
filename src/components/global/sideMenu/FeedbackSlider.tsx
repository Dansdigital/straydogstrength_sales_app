import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface SliderBarProps {
  isOpen: boolean;
  onClose: () => void;
}

const SliderBar = ({ isOpen, onClose }: SliderBarProps) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      sliderRef.current &&
      !sliderRef.current.contains(event.target as Node)
    ) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-[10000] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      ></div>

      {/* Slider */}
      <div
        ref={sliderRef}
        className={`fixed top-0 right-0 w-1/2 h-full bg-[var(--pop-up)] text-[var(--primary)] shadow-lg z-[11000] transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-medium">Feedback</h2>
          <button
            onClick={onClose}
            className="text-[var(--button)] hover:text-[var(--button-hover)] focus:outline-none"
          >
            &times;
          </button>
        </div>

        <form className="flex flex-col p-6 space-y-4">
          {/* Form Fields */}
          <label className="flex flex-col">
            <span className="font-medium">Subject:</span>
            <input
              type="text"
              name="subject"
              placeholder="Enter subject"
              className="mt-1 p-2 border rounded border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="flex flex-col">
            <span className="font-medium">Description:</span>
            <textarea
              name="description"
              placeholder="Enter description"
              className="mt-1 p-2 border rounded border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            ></textarea>
          </label>

          <label className="flex flex-col">
            <span className="font-medium">Email:</span>
            <input
              type="email"
              name="email"
              placeholder="Enter email"
              className="mt-1 p-2 border rounded border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <button
            type="submit"
            className="px-4 py-2 bg-[var(--button)] text-[var(--button-text)] hover:bg-[var(--button-hover)] rounded"
          >
            Submit
          </button>
        </form>
      </div>
    </>,
    document.body,
  );
};

export default SliderBar;

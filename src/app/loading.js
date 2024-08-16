export default function Loading() {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
            <div className="w-16 h-16 border-4 border-t-4 border-blue-500 border-solid rounded-3xl animate-spin"></div>
        </div>
    );
};

import { useState } from 'react';

const useLoading = () => {
    const [isLoading, setIsLoading] = useState(false);

    const startLoading = () => setIsLoading(true);
    const stopLoading = () => setIsLoading(false);

    const LoadingSpinner = () => {
        if (!isLoading) return null;

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000,
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '10px',
                    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                }}>
                    Loading...
                </div>
            </div>
        );
    };

    return { isLoading, startLoading, stopLoading, LoadingSpinner };
};

export default useLoading;
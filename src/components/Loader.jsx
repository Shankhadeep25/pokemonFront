export default function Loader({ text = 'Loading...' }) {
    return (
        <div className="loader-overlay">
            <div className="pokeball-spinner">
                <div className="pokeball-top"></div>
                <div className="pokeball-center">
                    <div className="pokeball-button"></div>
                </div>
                <div className="pokeball-bottom"></div>
            </div>
            <p className="loader-text">{text}</p>
        </div>
    );
}

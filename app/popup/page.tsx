export default function PopupPage(){
    return(
        <main style={{
            padding: 12, 
            width: 320, 
            fontFamily: "sustem-ui",
            display: "flex",
            flexDirection: "column",
            gap: 8
            }}>
            <h1 style={{ fontSize: 16, margin: 0}}>
                Job Application Tracker
            </h1>

            <p style= {{opacity: 0.8}}>
                0 applications tracked
            </p>

            <button 
                style={{
                    marginTop: 8,
                    padding: "6px 8px",
                    cursor: "pointer"
                }}>
                Add application
            </button>
        </main>
    );
}
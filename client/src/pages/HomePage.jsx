import { useCallback, useState } from "react";
import CurrentPricesTable from "../components/CurrentPricesTable";
import PriceUpdatePanel from "../components/PriceUpdatePanel";

function HomePage() {
  const [server, setServer] = useState("asia");
  const [priceRefreshKey, setPriceRefreshKey] = useState(0);
  const refreshPrices = useCallback(() => {
    setPriceRefreshKey((currentKey) => currentKey + 1);
  }, []);

  return (
    <div>
      <div className="mb-4">
        <PriceUpdatePanel
          server={server}
          onServerChange={setServer}
          onUpdateFinished={refreshPrices}
        />
      </div>

      <CurrentPricesTable
        key={server}
        server={server}
        refreshKey={priceRefreshKey}
      />
    </div>
  );
}

export default HomePage;

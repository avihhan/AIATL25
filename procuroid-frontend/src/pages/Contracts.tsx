import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  Building2,
  Loader2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { getContracts, type Contract } from '../api/apiCalls';

const Contracts = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getContracts();

      if (response.success && response.contracts) {
        setContracts(response.contracts);
      } else {
        setError(response.error || 'Failed to fetch contracts');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch contracts');
      console.error('Error fetching contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatContractId = (id: string): string => {
    return `CT-${id.substring(0, 8).toUpperCase()}`;
  };

  const handleDownload = (contract: Contract) => {
    window.open(contract.pdf_url, '_blank');
  };

  const handleView = (contract: Contract) => {
    setSelectedContract(contract);
  };

  const handleCloseViewer = () => {
    setSelectedContract(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2">
          Contracts
        </h1>
        <p className="text-gray-600 text-lg">View and manage your procurement contracts</p>
      </div>

      {/* Contracts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-3 text-gray-600">Loading contracts...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 text-lg">{error}</p>
          <button
            onClick={fetchContracts}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No contracts found</p>
          <p className="text-gray-500 text-sm mt-2">Contracts will appear here after you approve quotations</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contracts.map((contract) => {
            const contractData = contract.contract_data || {};
            const productDetails = contractData.product_details || {};
            const totalValue = productDetails.total_contract_value || 0;
            const currency = productDetails.currency || 'USD';

            return (
              <div
                key={contract.id}
                className="card bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-br from-primary-500 to-indigo-500 rounded-lg shadow-md">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{formatContractId(contract.id)}</h3>
                      <p className="text-xs text-gray-500">{formatDate(contract.created_at)}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      contract.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : contract.status === 'terminated'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {contract.status}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4 text-primary-600" />
                    <span className="font-medium">{contract.supplier_name}</span>
                  </div>

                  {productDetails.product_name && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Product:</span> {productDetails.product_name}
                    </div>
                  )}

                  {totalValue > 0 && (
                    <div className="text-lg font-bold text-gray-900">
                      {currency} {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>Created: {formatDate(contract.created_at)}</span>
                  </div>
                </div>

                <div className="flex space-x-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleView(contract)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-indigo-500 text-white rounded-lg hover:from-primary-600 hover:to-indigo-600 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleDownload(contract)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm font-medium"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PDF Viewer Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-primary-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{formatContractId(selectedContract.id)}</h2>
                  <p className="text-sm text-gray-500">{selectedContract.supplier_name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownload(selectedContract)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </button>
                <a
                  href={selectedContract.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
                <button
                  onClick={handleCloseViewer}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={selectedContract.pdf_url}
                className="w-full h-full border-0"
                title="Contract PDF Viewer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contracts;


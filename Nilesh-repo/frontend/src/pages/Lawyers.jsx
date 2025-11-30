import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/Card";
import axios from '../api/axios';
import toast from 'react-hot-toast';

const Lawyers = () => {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadLawyers = async () => {
      try {
        const response = await axios.get('api/lawyer/');
        setLawyers(response.data || []);
      } catch (err) {
        console.error('Failed to fetch lawyers:', err);
        setError('Failed to fetch lawyers. Please try again later.');
        toast.error('Unable to fetch lawyers right now.');
      } finally {
        setLoading(false);
      }
    };

    loadLawyers();
  }, []);

  return (
    <div className="container mx-auto py-10 animate-fade-in">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
          <span className="text-blue-400 text-xs font-medium">Legal Team</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">
          Our Lawyers
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Meet our team of experienced legal professionals
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && (
          <div className="col-span-full text-center text-gray-400">Loading verified lawyers...</div>
        )}
        {error && !loading && (
          <div className="col-span-full text-center text-red-400">{error}</div>
        )}
        {!loading && !error && lawyers.length === 0 && (
          <div className="col-span-full text-center text-gray-400">
            We are reviewing new lawyer applications. Please check back soon.
          </div>
        )}
        {lawyers.map((lawyer, index) => (
          <Link to={`/lawyer-profile/${lawyer?.user?.id || lawyer.id}`} key={lawyer?.user?.id || lawyer.id || index}>
            <Card className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600 transition-all duration-200 group animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardHeader className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center text-2xl font-bold mb-3 border border-blue-500/30 group-hover:border-blue-500/50 transition-all duration-200">
                  {(lawyer?.user?.name || lawyer?.user?.username || 'L')
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <CardTitle className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors duration-200">
                  {lawyer?.user?.name || lawyer?.user?.username || 'Verified Lawyer'}
                </CardTitle>
                <CardDescription className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-200">
                  {Array.isArray(lawyer.specializations) && lawyer.specializations.length > 0
                    ? lawyer.specializations.join(', ')
                    : 'General Practitioner'}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center text-sm text-gray-400 space-y-1">
                {typeof lawyer.experience_years === 'number' && (
                  <p>
                    Experience: {lawyer.experience_years} {lawyer.experience_years === 1 ? 'year' : 'years'}
                  </p>
                )}
                {lawyer.consultation_fee && (
                  <p>
                    Consultation fee: {lawyer.consultation_fee}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Lawyers;

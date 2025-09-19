import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, CheckCircle, X, Plus, Edit, Save, Trash2 } from 'lucide-react';

interface TeamResult {
  teamId: string;
  teamName: string;
  teamLogo?: string;
  wins: number;
  finishPoints: number;
  positionPoints: number;
  totalPoints: number;
  rank: number;
  qualified: boolean;
}

interface GroupResult {
  round: number;
  groupId: string;
  groupName: string;
  teams: TeamResult[];
  submittedAt?: Date;
}

interface Tournament {
  _id: string;
  name: string;
  totalRounds: number;
  currentRound: number;
  host: any;
  groups: Array<{
    _id?: string;
    name: string;
    round: number;
    participants: Array<{
      _id: string;
      username: string;
      profile?: {
        displayName?: string;
        avatar?: string;
      };
    }>;
  }>;
  groupResults?: Array<{
    round: number;
    groupId: string;
    groupName: string;
    teams: Array<{
      teamId: string;
      teamName: string;
      teamLogo?: string;
      wins: number;
      finishPoints: number;
      positionPoints: number;
      totalPoints: number;
      rank: number;
      qualified: boolean;
    }>;
    submittedAt?: string;
  }>;
  qualifications?: Array<{
    round: number;
    qualifiedTeams: string[];
    qualificationCriteria: number;
    totalQualified: number;
    qualifiedAt: string;
  }>;
  [key: string]: any; // Allow any additional properties
}

interface TournamentResultsProps {
  tournament: Tournament;
  isHost: boolean;
  onTournamentUpdated?: () => void;
}

const TournamentResults: React.FC<TournamentResultsProps> = ({ tournament, isHost, onTournamentUpdated }) => {
  const [selectedRound, setSelectedRound] = useState(1);
  const [overallStandings, setOverallStandings] = useState<TeamResult[]>([]);
  const [groupResults, setGroupResults] = useState<GroupResult[]>([]);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingResults, setEditingResults] = useState<TeamResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Ensure tournament ID is available
  useEffect(() => {
    if (tournament && !tournament._id) {
      console.error('Tournament ID is missing! Tournament object:', tournament);
    }
  }, [tournament]);
  const [qualificationSummary, setQualificationSummary] = useState({
    totalGroups: 0,
    qualifiedPerGroup: 8,
    totalQualified: 0,
  });
  const [editingQualificationCriteria, setEditingQualificationCriteria] = useState(false);
  const [tempQualificationCriteria, setTempQualificationCriteria] = useState(8);
  const [showQualificationModal, setShowQualificationModal] = useState(false);
  const [qualificationSettings, setQualificationSettings] = useState({
    teamsPerGroup: 2,
    nextRoundTeamsPerGroup: 2
  });
  const [showQualificationSettings, setShowQualificationSettings] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchResults(selectedRound);
    loadQualificationSettings();
  }, [selectedRound, tournament._id]);


  const loadQualificationSettings = async () => {
    try {
      const response = await axios.get(`/api/tournaments/${tournament._id}/qualification-settings`);
      if (response.data.success && response.data.data.qualificationSettings) {
        const settings = response.data.data.qualificationSettings;
        setQualificationSettings({
          teamsPerGroup: settings.teamsPerGroup || 2,
          nextRoundTeamsPerGroup: settings.nextRoundTeamsPerGroup || 2
        });
        console.log('Loaded qualification settings:', settings);
      }
    } catch (error: any) {
      console.error('Error loading qualification settings:', error);
      // Use default settings if loading fails
    }
  };

  const fetchResults = async (round: number) => {
    try {
      setLoading(true);
      console.log(`Fetching results for round ${round}, tournament ${tournament._id}`);
      const response = await axios.get(`/api/tournaments/${tournament._id}/results/${round}`);
      
      console.log('Full API response:', response);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      console.log('Response data type:', typeof response.data);

      // Check if response has the expected structure
      let roundResults, overallStandings;
      
      if (response.data && response.data.data) {
        // Backend returns { success: true, data: { roundResults, overallStandings } }
        roundResults = response.data.data.roundResults;
        overallStandings = response.data.data.overallStandings;
        console.log('Extracted from response.data.data:', { roundResults, overallStandings });
      } else if (response.data && response.data.roundResults) {
        // Direct structure { roundResults, overallStandings }
        roundResults = response.data.roundResults;
        overallStandings = response.data.overallStandings;
        console.log('Extracted from response.data directly:', { roundResults, overallStandings });
      } else {
        console.log('Unexpected response structure:', response.data);
        setGroupResults([]);
        setOverallStandings([]);
        return;
      }
      
      setGroupResults(roundResults || []);
      setOverallStandings(overallStandings || []);
      
      
      // Calculate qualification summary
      // Get total groups from tournament structure, not just results
      const totalGroups = tournament?.groups?.filter(group => group.round === selectedRound)?.length || 0;
      const qualifiedPerGroup = qualificationSettings.teamsPerGroup; // Use actual settings
      const totalQualified = overallStandings?.filter((team: TeamResult) => team.qualified).length || 0;
      
      setQualificationSummary({
        totalGroups,
        qualifiedPerGroup,
        totalQualified
      });

      console.log('Updated groupResults state:', roundResults);
      console.log('Updated overallStandings state:', overallStandings);
      
      // Check qualification status
      if (roundResults && roundResults.length > 0) {
        roundResults.forEach((groupResult: any) => {
          console.log(`Group ${groupResult.groupName} teams:`, groupResult.teams.map((t: any) => ({
            teamId: t.teamId,
            name: t.teamName,
            points: t.totalPoints,
            qualified: t.qualified
          })));
        });
      }

    } catch (error: any) {
      console.error('Error fetching results:', error);
      console.error('Error details:', error.response?.data);
      // Initialize with empty data if no results exist
      setGroupResults([]);
      setOverallStandings([]);
    } finally {
      setLoading(false);
    }
  };

  const startEditingGroup = async (groupId: string) => {
    console.log('Starting to edit group:', groupId);
    console.log('Available groupResults:', groupResults);
    
    // First, try to refresh the results to get the latest data
    try {
      const response = await axios.get(`/api/tournaments/${tournament._id}/results/${selectedRound}`);
      let roundResults;
      
      if (response.data && response.data.data) {
        roundResults = response.data.data.roundResults;
      } else if (response.data && response.data.roundResults) {
        roundResults = response.data.roundResults;
      }
      
      console.log('Fresh round results from API:', roundResults);
      
      // Match by group name for consistency
      const group = roundResults?.find((gr: any) => 
        gr.groupName === groupId
      );
      
      if (group) {
        console.log('Found existing group results from API:', group);
        setEditingGroup(groupId);
        setEditingResults([...group.teams]);
        return;
      }
    } catch (error) {
      console.error('Error refreshing results:', error);
    }
    
    // If no existing results found, create new ones
    console.log('No existing group results found, creating new ones');
    const tournamentGroup = tournament.groups.find(g => 
      (g._id && g._id.toString() === groupId) || g.name === groupId
    );
    
    if (tournamentGroup) {
      console.log('Found tournament group:', tournamentGroup);
      // Check if participants are populated or just ObjectIds
      const participants = tournamentGroup.participants || [];
      const newResults: TeamResult[] = participants.map((participant, index) => {
        // If participant is just an ObjectId string, use fallback name
        if (typeof participant === 'string') {
          return {
            teamId: participant,
            teamName: `Team ${index + 1}`,
            teamLogo: undefined,
            wins: 0,
            finishPoints: 0,
            positionPoints: 0,
            totalPoints: 0,
            rank: index + 1,
            qualified: false
          };
        }
        // If participant is populated user object
        return {
          teamId: participant._id,
          teamName: participant.profile?.displayName || participant.username || `Team ${index + 1}`,
          teamLogo: participant.profile?.avatar,
          wins: 0,
          finishPoints: 0,
          positionPoints: 0,
          totalPoints: 0,
          rank: index + 1,
          qualified: false
        };
      });
      
      console.log('Creating new results for group:', groupId);
      console.log('Tournament group:', tournamentGroup);
      console.log('Participants:', tournamentGroup.participants);
      console.log('New results:', newResults);
      setEditingGroup(groupId);
      setEditingResults(newResults);
    } else {
      console.log('Tournament group not found for groupId:', groupId);
    }
  };

  const updateTeamResult = (teamId: string, field: keyof TeamResult, value: number | boolean) => {
    setEditingResults(prev => prev.map(team => {
      if (team.teamId === teamId) {
        const updated = { ...team, [field]: value };
        // Recalculate total points
        if (field === 'finishPoints' || field === 'positionPoints') {
          updated.totalPoints = updated.finishPoints + updated.positionPoints;
        }
        return updated;
      }
      return team;
    }));
  };

  const saveGroupResults = async () => {
    if (!editingGroup) return;

    try {
      setLoading(true);
      
      // Sort teams by total points and assign ranks
      const sortedTeams = [...editingResults].sort((a, b) => b.totalPoints - a.totalPoints);
      sortedTeams.forEach((team, index) => {
        team.rank = index + 1;
        // Mark top teams as qualified based on settings
        const teamsToQualify = qualificationSettings.teamsPerGroup || 2;
        team.qualified = index < teamsToQualify;
      });

      const tournamentGroup = tournament.groups.find(g => 
        (g._id && g._id.toString() === editingGroup) || g.name === editingGroup
      );
      
      const groupName = tournamentGroup?.name || `Group ${editingGroup}`;
      // Always use the group name as groupId for consistency
      const groupId = groupName;
      

      const response = await axios.post(`/api/tournaments/${tournament._id}/results`, {
        round: selectedRound,
        groupId: groupId,
        groupName,
        teams: sortedTeams
      });

      // Update the groupResults state directly
      let updatedGroupResults = [...groupResults];
      
      // Try to find existing group result by group name
      const existingGroupIndex = updatedGroupResults.findIndex(gr => 
        gr.groupName === groupName
      );

      if (existingGroupIndex !== -1) {
        // Update existing group result
        updatedGroupResults[existingGroupIndex] = {
          ...updatedGroupResults[existingGroupIndex],
          teams: sortedTeams,
          submittedAt: new Date()
        };
      } else {
        // Add new group result
        updatedGroupResults.push({
          round: selectedRound,
          groupId: groupId,
          groupName: groupName,
          teams: sortedTeams,
          submittedAt: new Date()
        });
      }

      setGroupResults(updatedGroupResults);
      setEditingGroup(null);
      setEditingResults([]);
      
      
      // Also refresh tournament data if parent function is available
      if (onTournamentUpdated) {
        onTournamentUpdated();
      }
      
      // Show custom success dialog
      setSuccessMessage('Results saved and qualification applied automatically!');
      setShowSuccessDialog(true);
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setShowSuccessDialog(false);
      }, 3000);

    } catch (error: any) {
      console.error('Error saving group results:', error);
      const errorMsg = error.response?.data?.message || 'Failed to save results. Please try again.';
      setErrorMessage(errorMsg);
      setShowErrorDialog(true);
      
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setShowErrorDialog(false);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const toggleTeamQualification = (teamId: string) => {
    setOverallStandings(prev => prev.map(team => 
      team.teamId === teamId ? { ...team, qualified: !team.qualified } : team
    ));
  };


  const saveQualificationSettings = async () => {
    try {
      const response = await axios.post(`/api/tournaments/${tournament._id}/qualification-settings`, {
        round: selectedRound,
        teamsPerGroup: qualificationSettings.teamsPerGroup,
        nextRoundTeamsPerGroup: qualificationSettings.nextRoundTeamsPerGroup
      });

      if (response.data.success) {
        setShowQualificationSettings(false);
        
        // Auto create Round 2 after saving settings
        await autoCreateRound2();
      }
    } catch (error: any) {
      console.error('Error saving qualification settings:', error);
      setErrorMessage('Failed to save qualification settings');
      setShowErrorDialog(true);
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        setShowErrorDialog(false);
      }, 5000);
    }
  };

  // Auto create Round 2 after qualification settings are saved
  const autoCreateRound2 = async () => {
    try {
      setLoading(true);
      
      const qualifiedTeams = getQualifiedTeamsForRound2();
      
      if (qualifiedTeams.length === 0) {
        setSuccessMessage('Qualification settings saved! No qualified teams found for Round 2.');
        setShowSuccessDialog(true);
        setTimeout(() => setShowSuccessDialog(false), 3000);
        return;
      }

      // Calculate number of groups for Round 2
      const totalQualifiedTeams = qualifiedTeams.length;
      const teamsPerGroup = qualificationSettings.nextRoundTeamsPerGroup;
      const numberOfGroups = Math.ceil(totalQualifiedTeams / teamsPerGroup);

      // Create groups for Round 2
      const groups = [];
      for (let i = 0; i < numberOfGroups; i++) {
        const groupName = String.fromCharCode(65 + i); // A, B, C, D...
        const startIndex = i * teamsPerGroup;
        const endIndex = Math.min(startIndex + teamsPerGroup, totalQualifiedTeams);
        const groupTeams = qualifiedTeams.slice(startIndex, endIndex);

        groups.push({
          name: `Group ${groupName}`,
          round: 2,
          participants: groupTeams.map(team => ({
            teamId: team.teamId,
            teamName: team.teamName
          }))
        });
      }

      // Send to backend to create Round 2
      const requestData = {
        groups: groups,
        round: 2,
        qualifiedTeams: qualifiedTeams
      };
      
      const response = await axios.post(`/api/tournaments/${tournament._id}/auto-assign-round-2`, requestData);

      if (response.data.success) {
        setSuccessMessage(`Round 2 created automatically! ${numberOfGroups} groups created with ${totalQualifiedTeams} qualified teams.`);
        setShowSuccessDialog(true);
        setTimeout(() => {
          setShowSuccessDialog(false);
        }, 5000);
        
        // Refresh the tournament data
        window.location.reload();
      } else {
        throw new Error(response.data.message || 'Unknown error from backend');
      }
    } catch (error: any) {
      console.error('Error auto creating Round 2:', error);
      setErrorMessage('Failed to auto create Round 2. Please try manually.');
      setShowErrorDialog(true);
      setTimeout(() => {
        setShowErrorDialog(false);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get qualified teams for Round 2
  const getQualifiedTeamsForRound2 = () => {
    let qualifiedTeams = [];
    
    // First try from overallStandings
    qualifiedTeams = overallStandings.filter(team => team.qualified);
    
    // If no qualified teams found in overallStandings, check groupResults
    if (qualifiedTeams.length === 0) {
      for (const groupResult of groupResults) {
        const groupQualifiedTeams = groupResult.teams.filter(team => team.qualified);
        qualifiedTeams.push(...groupQualifiedTeams);
      }
    }
    
    return qualifiedTeams;
  };

  // Auto assign Round 2 groups with full functionality
  const autoAssignRound2Groups = async () => {
    try {
      setLoading(true);
      
      const qualifiedTeams = getQualifiedTeamsForRound2();
      
      // Validate tournament ID
      if (!tournament._id) {
        setErrorMessage('Tournament ID not found. Please refresh the page and try again.');
        setShowErrorDialog(true);
        setTimeout(() => setShowErrorDialog(false), 5000);
        return;
      }
      
      if (qualifiedTeams.length === 0) {
        setErrorMessage('No qualified teams found. Please ensure teams are qualified first.');
        setShowErrorDialog(true);
        setTimeout(() => setShowErrorDialog(false), 5000);
        return;
      }

      // Calculate number of groups for Round 2
      const totalQualifiedTeams = qualifiedTeams.length;
      const teamsPerGroup = qualificationSettings.nextRoundTeamsPerGroup;
      const numberOfGroups = Math.ceil(totalQualifiedTeams / teamsPerGroup);

      // Create groups for Round 2
      const groups = [];
      for (let i = 0; i < numberOfGroups; i++) {
        const groupName = String.fromCharCode(65 + i); // A, B, C, D...
        const startIndex = i * teamsPerGroup;
        const endIndex = Math.min(startIndex + teamsPerGroup, totalQualifiedTeams);
        const groupTeams = qualifiedTeams.slice(startIndex, endIndex);

        groups.push({
          name: `Group ${groupName}`,
          round: 2,
          participants: groupTeams.map(team => ({
            teamId: team.teamId,
            teamName: team.teamName
          }))
        });
      }

      // Send to backend to create Round 2 with full functionality
      const requestData = {
        groups: groups,
        round: 2,
        qualifiedTeams: qualifiedTeams
      };
      
      const response = await axios.post(`/api/tournaments/${tournament._id}/auto-assign-round-2`, requestData);

      if (response.data.success) {
        setSuccessMessage(`Round 2 created successfully! ${numberOfGroups} groups created with ${totalQualifiedTeams} qualified teams. Broadcast and results are ready.`);
        setShowSuccessDialog(true);
        setTimeout(() => {
          setShowSuccessDialog(false);
        }, 5000);
        
        // Refresh the tournament data
        if (onTournamentUpdated) {
          onTournamentUpdated();
        } else {
          // Fallback to page reload if parent refresh is not available
          window.location.reload();
        }
      } else {
        throw new Error(response.data.message || 'Unknown error from backend');
      }
    } catch (error: any) {
      console.error('Error creating Round 2:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create Round 2. Please try again.';
      setErrorMessage(errorMessage);
      setShowErrorDialog(true);
      setTimeout(() => {
        setShowErrorDialog(false);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const proceedToRound2 = async () => {
    try {
      setLoading(true);
      
      // Get all qualified teams from Round 1 - check both overallStandings and groupResults
      let qualifiedTeams = [];
      
      // First try from overallStandings
      qualifiedTeams = overallStandings.filter(team => team.qualified);
      
      // If no qualified teams found in overallStandings, check groupResults
      if (qualifiedTeams.length === 0) {
        console.log('No qualified teams in overallStandings, checking groupResults...');
        for (const groupResult of groupResults) {
          const groupQualifiedTeams = groupResult.teams.filter(team => team.qualified);
          qualifiedTeams.push(...groupQualifiedTeams);
        }
      }
      
      console.log('Found qualified teams:', qualifiedTeams.length, qualifiedTeams);
      console.log('Overall standings:', overallStandings);
      console.log('Group results:', groupResults);
      
      if (qualifiedTeams.length === 0) {
        setErrorMessage('No qualified teams found. Please ensure teams are qualified first.');
        setShowErrorDialog(true);
        setTimeout(() => setShowErrorDialog(false), 5000);
        return;
      }

      // Calculate number of groups for Round 2
      const totalQualifiedTeams = qualifiedTeams.length;
      const teamsPerGroup = qualificationSettings.nextRoundTeamsPerGroup;
      const numberOfGroups = Math.ceil(totalQualifiedTeams / teamsPerGroup);

      // Create groups for Round 2
      const groups = [];
      for (let i = 0; i < numberOfGroups; i++) {
        const groupName = String.fromCharCode(65 + i); // A, B, C, D...
        const startIndex = i * teamsPerGroup;
        const endIndex = Math.min(startIndex + teamsPerGroup, totalQualifiedTeams);
        const groupTeams = qualifiedTeams.slice(startIndex, endIndex);

        groups.push({
          name: `Group ${groupName}`,
          round: 2,
          participants: groupTeams.map(team => ({
            teamId: team.teamId,
            teamName: team.teamName
          }))
        });
      }

      // Send to backend to create Round 2
      const response = await axios.post(`/api/tournaments/${tournament._id}/create-round-2`, {
        groups: groups,
        round: 2
      });

      if (response.data.success) {
        setSuccessMessage(`Round 2 created successfully! ${numberOfGroups} groups created with ${totalQualifiedTeams} qualified teams.`);
        setShowSuccessDialog(true);
        setTimeout(() => {
          setShowSuccessDialog(false);
        }, 5000);
        
        // Refresh the tournament data
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error creating Round 2:', error);
      setErrorMessage('Failed to create Round 2. Please try again.');
      setShowErrorDialog(true);
      setTimeout(() => {
        setShowErrorDialog(false);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const qualifyTeamsOnBasisOfResult = async () => {
    try {
      setLoading(true);
      
      // First refresh the results to make sure we have the latest data
      console.log('Refreshing results before qualification...');
      const response = await axios.get(`/api/tournaments/${tournament._id}/results/${selectedRound}`);
      
      let freshGroupResults = [];
      if (response.data && response.data.data) {
        freshGroupResults = response.data.data.roundResults || [];
      } else if (response.data && response.data.roundResults) {
        freshGroupResults = response.data.roundResults || [];
      }
      
      console.log('Fresh groupResults from API:', freshGroupResults);
      console.log('Fresh groupResults length:', freshGroupResults.length);
      
      // Get all teams from all groups for this round
      const allTeams: (TeamResult & { groupName: string; groupId: string })[] = [];
      freshGroupResults.forEach((groupResult: any) => {
        console.log('Processing group:', groupResult.groupName, 'teams:', groupResult.teams?.length || 0);
        if (groupResult.teams && groupResult.teams.length > 0) {
          groupResult.teams.forEach((team: any) => {
            allTeams.push({
              ...team,
              groupName: groupResult.groupName,
              groupId: groupResult.groupId
            });
          });
        }
      });

      console.log('All teams before sorting:', allTeams.map(t => ({
        teamId: t.teamId,
        teamName: t.teamName,
        totalPoints: t.totalPoints,
        qualified: t.qualified
      })));

      // Sort all teams by total points (descending)
      allTeams.sort((a, b) => b.totalPoints - a.totalPoints);

      // Calculate how many teams to qualify based on settings
      const teamsToQualify = qualificationSummary.totalGroups * qualificationSettings.teamsPerGroup;
      
      console.log('Teams to qualify calculation:', {
        totalGroups: qualificationSummary.totalGroups,
        teamsPerGroup: qualificationSettings.teamsPerGroup,
        teamsToQualify
      });
      
      if (allTeams.length === 0) {
        console.error('No teams found in fresh results:', freshGroupResults);
        throw new Error('No teams found in results. Please save some results first.');
      }
      
      // For single group, qualify at least 1 team
      const actualTeamsToQualify = Math.max(1, Math.min(teamsToQualify, allTeams.length));
      
      // Get top teams for qualification
      const qualifiedTeams = allTeams.slice(0, actualTeamsToQualify).map(team => team.teamId.toString());

      console.log('Auto-qualifying teams based on results:', qualifiedTeams);
      console.log('Qualification criteria:', qualificationSettings.teamsPerGroup);
      console.log('Total teams to qualify:', teamsToQualify);
      console.log('Actual teams to qualify:', actualTeamsToQualify);
      console.log('All teams sorted by points:', allTeams.map(t => ({ 
        teamId: t.teamId, 
        name: t.teamName, 
        points: t.totalPoints 
      })));

      console.log('Sending qualification request:', {
        tournamentId: tournament._id,
        round: selectedRound,
        qualifiedTeams,
        qualificationCriteria: qualificationSettings.teamsPerGroup
      });

      const qualifyResponse = await axios.post(`/api/tournaments/${tournament._id}/qualify`, {
        round: selectedRound,
        qualifiedTeams,
        qualificationCriteria: qualificationSettings.teamsPerGroup
      });

      console.log('Qualification response:', qualifyResponse.data);

      await fetchResults(selectedRound);
      
      // Show custom success dialog
      setSuccessMessage(`${qualifiedTeams.length} teams qualified based on results!`);
      setShowSuccessDialog(true);
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setShowSuccessDialog(false);
      }, 3000);

    } catch (error: any) {
      console.error('Error qualifying teams:', error);
      const errorMsg = error.response?.data?.message || 'Failed to qualify teams. Please try again.';
      setErrorMessage(errorMsg);
      setShowErrorDialog(true);
      
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setShowErrorDialog(false);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const proceedToNextRound = () => {
    setShowQualificationModal(true);
  };

  const handleQualificationSettings = async () => {
    try {
      setLoading(true);
      const nextRound = selectedRound + 1;

      console.log('Creating next round:', {
        currentRound: selectedRound,
        nextRound,
        teamsPerGroup: qualificationSettings.nextRoundTeamsPerGroup,
        qualificationCriteria: qualificationSettings.teamsPerGroup
      });

      await axios.post(`/api/tournaments/${tournament._id}/next-round`, {
        currentRound: selectedRound,
        nextRound,
        teamsPerGroup: qualificationSettings.nextRoundTeamsPerGroup,
        qualificationCriteria: qualificationSettings.teamsPerGroup
      });

      console.log(`Round ${nextRound} groups created successfully!`);
      
      // Show custom success dialog
      setSuccessMessage(`Round ${nextRound} groups created successfully!`);
      setShowSuccessDialog(true);
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setShowSuccessDialog(false);
      }, 3000);

      setSelectedRound(nextRound);
      await fetchResults(nextRound);
      setShowQualificationModal(false);

    } catch (error: any) {
      console.error('Error creating next round:', error);
      const errorMsg = error.response?.data?.message || 'Failed to create next round. Please try again.';
      setErrorMessage(errorMsg);
      setShowErrorDialog(true);
      
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setShowErrorDialog(false);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };


  const renderGroupResults = () => {
    
    return (
      <div className="space-y-4 md:space-y-6 mb-4 md:mb-6">
        {tournament.groups
          .filter(group => group.round === selectedRound)
          .map(group => {
            const groupId = group._id?.toString() || group.name;
            
            // Always match by group name for consistency
            const groupResult = groupResults.find(gr => 
              gr.groupName === group.name ||
              gr.groupId === group.name
            );
            const isEditing = editingGroup === groupId;
          
          return (
            <div key={group._id || group.name} className="space-y-3 md:space-y-4">
              {/* Group Results */}
              <div className="bg-gray-900 rounded-lg p-3 md:p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-3 md:space-y-0">
                  <h3 className="text-base md:text-lg font-bold text-white">
                    {group.name.toUpperCase()} RESULTS
                  </h3>
                  {isHost && (
                    <button
                      onClick={() => startEditingGroup(groupId)}
                      className="px-3 py-2 bg-blue-600 text-white text-xs md:text-sm rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
                    >
                      <Edit className="h-3 w-3 md:h-4 md:w-4" />
                      <span>{groupResult ? 'Edit' : 'Add Results'}</span>
                    </button>
                  )}
                </div>


                {/* Table header */}
                <div className="mb-3 md:mb-4">
                  <div className="text-yellow-400 text-xs md:text-sm mb-2">ROUND {selectedRound} | DAY 1</div>
                </div>

              {isEditing ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-left py-2 px-2 md:px-3 text-white text-xs md:text-sm">RANK</th>
                        <th className="text-left py-2 px-2 md:px-3 text-white text-xs md:text-sm">TEAM</th>
                        <th className="text-center py-2 px-2 md:px-3 text-white text-xs md:text-sm">WINS</th>
                        <th className="text-center py-2 px-2 md:px-3 text-white text-xs md:text-sm">FIN.PTS</th>
                        <th className="text-center py-2 px-2 md:px-3 text-white text-xs md:text-sm">POS.PTS</th>
                        <th className="text-center py-2 px-2 md:px-3 text-white text-xs md:text-sm">TOT.PTS</th>
                        <th className="text-center py-2 px-2 md:px-3 text-white text-xs md:text-sm">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingResults.map((team, index) => (
                        <tr key={team.teamId?.toString() || `edit-team-${index}`} className="border-b border-gray-700 bg-gray-700/50">
                          <td className="py-2 px-2 md:px-3 text-white font-bold text-xs md:text-sm">{team.rank}</td>
                          <td className="py-2 px-2 md:px-3 text-white text-xs md:text-sm truncate">{team.teamName}</td>
                          <td className="py-2 px-2 md:px-3 text-center">
                            <input
                              type="number"
                              value={team.wins}
                              onChange={(e) => updateTeamResult(team.teamId, 'wins', parseInt(e.target.value) || 0)}
                              className="w-10 md:w-12 px-1 md:px-2 py-1 bg-gray-600 text-white rounded text-xs md:text-sm text-center"
                              placeholder="0"
                            />
                          </td>
                          <td className="py-2 px-2 md:px-3 text-center">
                            <input
                              type="number"
                              value={team.finishPoints}
                              onChange={(e) => updateTeamResult(team.teamId, 'finishPoints', parseInt(e.target.value) || 0)}
                              className="w-12 md:w-16 px-1 md:px-2 py-1 bg-gray-600 text-white rounded text-xs md:text-sm text-center"
                              placeholder="0"
                            />
                          </td>
                          <td className="py-2 px-2 md:px-3 text-center">
                            <input
                              type="number"
                              value={team.positionPoints}
                              onChange={(e) => updateTeamResult(team.teamId, 'positionPoints', parseInt(e.target.value) || 0)}
                              className="w-12 md:w-16 px-1 md:px-2 py-1 bg-gray-600 text-white rounded text-xs md:text-sm text-center"
                              placeholder="0"
                            />
                          </td>
                          <td className="py-2 px-2 md:px-3 text-center text-white font-bold text-xs md:text-sm">{team.totalPoints}</td>
                          <td className="py-2 px-2 md:px-3 text-center">
                            {selectedRound === tournament.totalRounds ? (
                              // For last round, show winner, runner-up, 2nd runner-up
                              team.rank === 1 ? (
                                <span className="px-1 md:px-2 py-1 bg-yellow-600 text-white text-xs rounded font-bold">
                                  WINNER
                                </span>
                              ) : team.rank === 2 ? (
                                <span className="px-1 md:px-2 py-1 bg-gray-400 text-white text-xs rounded font-bold">
                                  RUNNER-UP
                                </span>
                              ) : team.rank === 3 ? (
                                <span className="px-1 md:px-2 py-1 bg-orange-600 text-white text-xs rounded font-bold">
                                  2ND RUNNER-UP
                                </span>
                              ) : (
                                <span className="px-1 md:px-2 py-1 text-gray-400 text-xs font-bold">
                                  -
                                </span>
                              )
                            ) : (
                              // For other rounds, show qualified/eliminated
                              team.qualified ? (
                                <span className="px-1 md:px-2 py-1 bg-green-600 text-white text-xs rounded font-bold">
                                  QUALIFIED
                                </span>
                              ) : (
                                <span className="px-1 md:px-2 py-1 bg-red-600 text-white text-xs rounded font-bold">
                                  ELIMINATED
                                </span>
                              )
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mt-4">
                    <button
                      onClick={saveGroupResults}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center space-x-1 text-sm md:text-base"
                    >
                      <Save className="h-3 w-3 md:h-4 md:w-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingGroup(null);
                        setEditingResults([]);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm md:text-base"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : groupResult ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-left py-2 px-2 md:px-3 text-white text-xs md:text-sm">RANK</th>
                        <th className="text-left py-2 px-2 md:px-3 text-white text-xs md:text-sm">TEAM</th>
                        <th className="text-center py-2 px-2 md:px-3 text-white text-xs md:text-sm">WINS</th>
                        <th className="text-center py-2 px-2 md:px-3 text-white text-xs md:text-sm">FIN.PTS</th>
                        <th className="text-center py-2 px-2 md:px-3 text-white text-xs md:text-sm">POS.PTS</th>
                        <th className="text-center py-2 px-2 md:px-3 text-white text-xs md:text-sm">TOT.PTS</th>
                        <th className="text-center py-2 px-2 md:px-3 text-white text-xs md:text-sm">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupResult.teams.map((team, index) => {
                        const uniqueId = `${groupResult.groupId}-${team.teamId}-${index}`;
                        
                        return (
                          <tr
                            key={uniqueId}
                            className={`border-b border-gray-700 ${
                              index < 8 ? 'bg-yellow-500/10' : 'bg-gray-700/50'
                            }`}
                          >
                          <td className="py-2 px-2 md:px-3 text-white font-bold text-xs md:text-sm">{team.rank}</td>
                          <td className="py-2 px-2 md:px-3 text-white text-xs md:text-sm truncate">{team.teamName}</td>
                          <td className="py-2 px-2 md:px-3 text-center text-white text-xs md:text-sm">{team.wins}</td>
                          <td className="py-2 px-2 md:px-3 text-center text-white text-xs md:text-sm">{team.finishPoints}</td>
                          <td className="py-2 px-2 md:px-3 text-center text-white text-xs md:text-sm">{team.positionPoints}</td>
                          <td className="py-2 px-2 md:px-3 text-center text-white font-bold text-xs md:text-sm">{team.totalPoints}</td>
                          <td className="py-2 px-2 md:px-3 text-center">
                            {selectedRound === tournament.totalRounds ? (
                              // For last round, show winner, runner-up, 2nd runner-up
                              team.rank === 1 ? (
                                <span className="px-1 md:px-2 py-1 bg-yellow-600 text-white text-xs rounded font-bold">
                                  WINNER
                                </span>
                              ) : team.rank === 2 ? (
                                <span className="px-1 md:px-2 py-1 bg-gray-400 text-white text-xs rounded font-bold">
                                  RUNNER-UP
                                </span>
                              ) : team.rank === 3 ? (
                                <span className="px-1 md:px-2 py-1 bg-orange-600 text-white text-xs rounded font-bold">
                                  2ND RUNNER-UP
                                </span>
                              ) : (
                                <span className="px-1 md:px-2 py-1 text-gray-400 text-xs font-bold">
                                  -
                                </span>
                              )
                            ) : (
                              // For other rounds, show qualified/eliminated
                              team.qualified ? (
                                <span className="px-1 md:px-2 py-1 bg-green-600 text-white text-xs rounded font-bold">
                                  QUALIFIED
                                </span>
                              ) : (
                                <span className="px-1 md:px-2 py-1 bg-red-600 text-white text-xs rounded font-bold">
                                  ELIMINATED
                                </span>
                              )
                            )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8">
                  No results submitted yet
                </div>
              )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSuccessDialog = () => {
    if (!showSuccessDialog) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm mx-4 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Success!</h3>
          <p className="text-gray-300 mb-4">{successMessage}</p>
          <button
            onClick={() => setShowSuccessDialog(false)}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    );
  };

  const renderErrorDialog = () => {
    if (!showErrorDialog) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm mx-4 text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Error!</h3>
          <p className="text-gray-300 mb-4">{errorMessage}</p>
          <button
            onClick={() => setShowErrorDialog(false)}
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    );
  };

  const renderQualificationModal = () => {
    if (!showQualificationModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-xl font-bold text-white mb-4">
            Round {selectedRound + 1} Qualification Settings
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Teams to qualify from each group (Round {selectedRound})
              </label>
              <input
                type="number"
                value={qualificationSettings.teamsPerGroup}
                onChange={(e) => setQualificationSettings(prev => ({
                  ...prev,
                  teamsPerGroup: parseInt(e.target.value) || 8
                }))}
                className="w-full px-3 py-2 bg-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="32"
              />
              <p className="text-gray-400 text-xs mt-1">
                How many teams from each group qualify for Round {selectedRound + 1}
              </p>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Teams per group in Round {selectedRound + 1}
              </label>
              <input
                type="number"
                value={qualificationSettings.nextRoundTeamsPerGroup}
                onChange={(e) => setQualificationSettings(prev => ({
                  ...prev,
                  nextRoundTeamsPerGroup: parseInt(e.target.value) || 16
                }))}
                className="w-full px-3 py-2 bg-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="2"
                max="32"
              />
              <p className="text-gray-400 text-xs mt-1">
                How many teams will be in each group for Round {selectedRound + 1}
              </p>
            </div>

            <div className="bg-gray-700 rounded p-3">
              <h4 className="text-white font-medium mb-2">Summary:</h4>
              <p className="text-gray-300 text-sm">
                • {qualificationSummary.totalGroups} groups × {qualificationSettings.teamsPerGroup} teams = {qualificationSummary.totalGroups * qualificationSettings.teamsPerGroup} total qualified teams
              </p>
              <p className="text-gray-300 text-sm">
                • {qualificationSummary.totalGroups * qualificationSettings.teamsPerGroup} teams ÷ {qualificationSettings.nextRoundTeamsPerGroup} per group = {Math.ceil((qualificationSummary.totalGroups * qualificationSettings.teamsPerGroup) / qualificationSettings.nextRoundTeamsPerGroup)} groups in Round {selectedRound + 1}
              </p>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleQualificationSettings}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors font-medium"
            >
              {loading ? 'Creating...' : 'Create Round ' + (selectedRound + 1)}
            </button>
            <button
              onClick={() => setShowQualificationModal(false)}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderQualificationSummary = () => {
    console.log('Rendering qualification summary:', qualificationSummary);
    console.log('Overall standings qualified teams:', overallStandings.filter(team => team.qualified).length);
    
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">
          Round {selectedRound} Qualification Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{qualificationSummary.totalGroups}</div>
            <div className="text-gray-400 text-sm">Total Groups</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{qualificationSettings.teamsPerGroup}</div>
            <div className="text-gray-400 text-sm">Qualified per Group</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{qualificationSummary.totalGroups * qualificationSettings.teamsPerGroup}</div>
            <div className="text-gray-400 text-sm">Total Qualified</div>
          </div>
        </div>
        {isHost && (
          <div className="space-y-4">

            {selectedRound < tournament.totalRounds && (
              <button
                onClick={proceedToNextRound}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Proceed to Round {selectedRound + 1}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading results...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-gray-800 rounded-lg p-4 md:p-6">
        <h2 className="text-lg md:text-2xl font-bold text-white mb-4 flex items-center">
          <Trophy className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3 text-yellow-400" />
          Tournament Results
        </h2>
        <p className="text-sm md:text-base text-gray-400 mb-4 md:mb-6">
          View and manage tournament results, team standings, and qualifications.
        </p>
        
        {/* Debug Refresh Button */}
        
        {/* Round Selector */}
        <div className="flex overflow-x-auto space-x-2 mb-4 md:mb-6 scrollbar-hide">
          {Array.from({ length: tournament.totalRounds }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setSelectedRound(i + 1)}
              className={`px-3 py-2 md:px-4 md:py-2 rounded-lg font-medium transition-colors text-sm md:text-base whitespace-nowrap ${
                selectedRound === i + 1
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              Round {i + 1}
            </button>
          ))}
        </div>

        {/* Universal Qualification Settings - Only show if not the last round */}
        {isHost && selectedRound < tournament.totalRounds && (
          <div className="bg-gray-900 rounded-lg p-4 md:p-6 mb-4 md:mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-3 md:space-y-0">
            <h3 className="text-base md:text-lg font-bold text-white">
              Qualification Settings
            </h3>
              <button
                onClick={() => setShowQualificationSettings(!showQualificationSettings)}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs md:text-sm"
              >
                {showQualificationSettings ? 'Hide' : 'Configure'}
              </button>
            </div>
            
            {showQualificationSettings && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-white text-xs md:text-sm font-medium mb-2">
                      Teams to qualify from each group (Round {selectedRound})
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={qualificationSettings.teamsPerGroup}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 8;
                          setQualificationSettings(prev => ({
                            ...prev,
                            teamsPerGroup: value
                          }));
                          setQualificationSummary(prev => ({
                            ...prev,
                            qualifiedPerGroup: value
                          }));
                        }}
                        className="w-16 md:w-20 px-2 md:px-3 py-2 bg-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        min="1"
                        max="32"
                      />
                      <span className="text-gray-400 text-xs md:text-sm">teams per group</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      How many teams from each group will qualify for Round {selectedRound + 1}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-white text-xs md:text-sm font-medium mb-2">
                      Teams per group in Round {selectedRound + 1}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={qualificationSettings.nextRoundTeamsPerGroup}
                        onChange={(e) => setQualificationSettings(prev => ({
                          ...prev,
                          nextRoundTeamsPerGroup: parseInt(e.target.value) || 16
                        }))}
                        className="w-16 md:w-20 px-2 md:px-3 py-2 bg-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        min="2"
                        max="32"
                      />
                      <span className="text-gray-400 text-xs md:text-sm">teams per group</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      How many teams will be in each group for Round {selectedRound + 1}
                    </p>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-700 rounded">
                  <h4 className="text-white font-medium mb-2">Preview:</h4>
                  <p className="text-gray-300 text-sm">
                    • {qualificationSummary.totalGroups} groups × {qualificationSettings.teamsPerGroup} teams = <span className="text-yellow-400 font-bold">{qualificationSummary.totalGroups * qualificationSettings.teamsPerGroup}</span> total qualified teams
                  </p>
                  <p className="text-gray-300 text-sm">
                    • {qualificationSummary.totalGroups * qualificationSettings.teamsPerGroup} teams ÷ {qualificationSettings.nextRoundTeamsPerGroup} per group = <span className="text-yellow-400 font-bold">{Math.ceil((qualificationSummary.totalGroups * qualificationSettings.teamsPerGroup) / qualificationSettings.nextRoundTeamsPerGroup)}</span> groups in Round {selectedRound + 1}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3">
                  <button
                    onClick={saveQualificationSettings}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                  >
                    {loading ? 'Creating Round 2...' : 'Save Settings & Create Round 2'}
                  </button>
                  <button
                    onClick={() => setShowQualificationSettings(false)}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Group Results */}
      {renderGroupResults()}

      {/* Qualified Teams Display and Round 2 Setup */}
      {isHost && selectedRound === 1 && (
        <div className="bg-gray-900 rounded-lg p-4 md:p-6 mb-4 md:mb-6">
          <h3 className="text-base md:text-lg font-bold text-white mb-4">Round 2 Setup</h3>
          
          {/* Qualified Teams Display */}
          <div className="mb-4 md:mb-6">
            <h4 className="text-sm md:text-base font-semibold text-white mb-3">Qualified Teams for Round 2:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {getQualifiedTeamsForRound2().map((team, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-3 flex items-center space-x-2 md:space-x-3">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs md:text-sm font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm md:text-base truncate">{team.teamName}</div>
                    <div className="text-gray-400 text-xs md:text-sm">Points: {team.totalPoints}</div>
                  </div>
                </div>
              ))}
            </div>
            {getQualifiedTeamsForRound2().length === 0 && (
              <div className="text-center text-gray-400 py-8">
                No qualified teams found. Please ensure teams are qualified first.
              </div>
            )}
          </div>

          {/* Round 2 Configuration Preview */}
          {getQualifiedTeamsForRound2().length > 0 && (
            <div className="mb-4 md:mb-6 p-3 md:p-4 bg-gray-800 rounded-lg">
              <h4 className="text-sm md:text-base font-semibold text-white mb-2">Round 2 Configuration:</h4>
              <p className="text-gray-300 text-xs md:text-sm">
                • {getQualifiedTeamsForRound2().length} qualified teams will be divided into {Math.ceil(getQualifiedTeamsForRound2().length / qualificationSettings.nextRoundTeamsPerGroup)} groups
              </p>
              <p className="text-gray-300 text-xs md:text-sm">
                • {qualificationSettings.nextRoundTeamsPerGroup} teams per group in Round 2
              </p>
            </div>
          )}

          {/* Auto Assign Button */}
          {getQualifiedTeamsForRound2().length > 0 && (
            <div className="text-center">
              <button
                onClick={autoAssignRound2Groups}
                disabled={loading}
                className="px-4 py-2 md:px-6 md:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm md:text-base"
              >
                {loading ? 'Creating Round 2...' : 'Auto Assign Round 2 Groups'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Success Dialog */}
      {renderSuccessDialog()}

      {/* Error Dialog */}
      {renderErrorDialog()}

      {/* Qualification Modal */}
      {renderQualificationModal()}
    </div>
  );
};

export default TournamentResults;

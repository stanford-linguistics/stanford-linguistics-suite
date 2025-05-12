#!/usr/bin/env python # -*- coding: utf-8 -*-

import os
import re  # Added missing import for the pause_splitter function
from collections import defaultdict
import cPickle as pkl
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import codecs
import nltk
import sys  # Added missing import for sys.stderr.write
import traceback
import time

# Create a compatibility layer for Python 2/3
try:
    # Python 2
    xrange
except NameError:
    # Python 3
    xrange = range
from nltk import compat
from nltk.tree import Tree
import nltk.data
from deptree import DependencyTree, DependencyTreeParser
import argparse


def Get_script_directory():
    absolute_path = os.path.abspath(__file__)
    return os.path.dirname(absolute_path)


DATE = '2015-04-20'
MODELS_VERSION = '3.5.2'
EJML_VERSION = '0.23'

script_dir = Get_script_directory()
os.environ['STANFORD_PARSER'] = os.path.join(
    script_dir, 'stanford-library/stanford-parser-full-%s/stanford-parser.jar' % DATE)
os.environ['STANFORD_MODELS'] = os.path.join(script_dir, 'stanford-library/stanford-parser-full-%s/stanford-parser-%s-models.jar' % (
    DATE, MODELS_VERSION))
os.environ['STANFORD_EJML'] = os.path.join(script_dir, 'stanford-library/stanford-parser-full-%s/ejml-%s.jar' % (
    DATE, EJML_VERSION))
pickle_path = os.path.join(script_dir, "pickle_jar", "sylcmu.pkl")
sylcmu = pkl.load(open(pickle_path))
sent_splitter = nltk.data.load('tokenizers/punkt/english.pickle')


def Extant_file(value):
    # Type for argparse - checks that file exists but does not open.
    if not os.path.exists(value):
        raise argparse.ArgumentTypeError("{0} does not exist".format(value))
    return value


def Replace_dashes_with_underscores(string):
    return string.replace("-", "_")


def Validate_arguments():
    parser = argparse.ArgumentParser(
        description='Compute T-orders in constraint-based phonology')
    parser.add_argument("-f", "--input-file", dest="input",
                        help="input txt file", metavar="<FILEPATH>", type=Extant_file)
    parser.add_argument("-o", "--output", dest="output_directory",
                        help="output path for results (default: current script directory)", metavar="<FILEPATH>")
    parser.add_argument("--unstressed_words", dest="unstressed_words", default=[],
                        nargs='+', help="List of strings to use for unstressed words")
    parser.add_argument("--unstressed_tags", dest="unstressed_tags", default=[],
                        nargs='+', help="List of strings to use for unstressed tags")
    parser.add_argument("--unstressed_deps", dest="unstressed_deps", default=[],
                        nargs='+', help="List of strings to use for unstressed deps")
    parser.add_argument("--ambiguous_words", dest="ambiguous_words", default=[],
                        nargs='+', help="List of strings to use for ambiguous words")
    parser.add_argument("--ambiguous_tags", dest="ambiguous_tags", default=[],
                        nargs='+', help="List of strings to use for ambiguous tags")
    parser.add_argument("--ambiguous_deps", dest="ambiguous_deps", default=[],
                        nargs='+', help="List of strings to use for ambiguous deps")
    parser.add_argument("--stressed_words", dest="stressed_words", default=[],
                        nargs='+', help="List of strings to use for stressed words")
    args = parser.parse_args()
    return args


def Create_directory(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)


def Set_output_directory(directory):
    if directory:
        Create_directory(directory)
        return directory
    else:
        return Get_script_directory()
# =================================================================================================
# Entrypoint
# =================================================================================================


args = Validate_arguments()

# =================================================================================================
# Optional parameters
# =================================================================================================
output_prefix = Set_output_directory(args.output_directory)
unstressed_words = args.unstressed_words
unstressed_tags = args.unstressed_tags
unstressed_deps = args.unstressed_deps
ambiguous_words = args.ambiguous_words
ambiguous_tags = args.ambiguous_tags
ambiguous_deps = args.ambiguous_deps
stressed_words = args.stressed_words

print('1', unstressed_words)
print('2', unstressed_tags)
print('3', unstressed_deps)
print('4', ambiguous_words)
print('5', ambiguous_tags)
print('6', ambiguous_deps)
print('7', stressed_words)

# ***********************************************************************
# Multiprocessing worker


def parse_worker(q):
    """Process input files and generate metrical tree results"""
    # Create a debug log file
    debug_log_path = os.path.join(output_prefix, 'debug_log.txt')
    with open(debug_log_path, 'w') as debug_file:
        debug_file.write("Starting metrical tree parse worker\n")
        debug_file.write("Python version: {}\n".format(sys.version))
        debug_file.write("Output prefix: {}\n".format(output_prefix))
        
        try:
            debug_file.write("Loading DependencyTreeParser...\n")
            model_path = os.path.join(script_dir, 'stanford-library/stanford-parser-full-%s/edu/stanford/nlp/models/lexparser/englishPCFG.ser.gz' % DATE)
            debug_file.write("Model path: {}\n".format(model_path))
            
            parser = DependencyTreeParser(model_path=model_path)
            debug_file.write("Creating MetricalTreeParser...\n")
            parser = MetricalTreeParser(parser)
            debug_file.write("Parser initialization complete\n")
            
            for filename in iter(q.get, 'STOP'):
                try:
                    debug_file.write("\n===== Processing file: {} =====\n".format(filename))
                    debug_file.write("Reading file content...\n")
                    sents = []
                    with codecs.open(filename, encoding='utf-8') as f:
                        content = f.read()
                        debug_file.write("File size: {} bytes\n".format(len(content)))
                        for line in content.splitlines():
                            sents.extend(pause_splitter(line))
                    
                    print("Processing {} sentences from {}".format(len(sents), filename))
                    debug_file.write("Sentences to process: {}\n".format(len(sents)))
                    debug_file.write("Starting parsing with stats_raw_parse_sents...\n")
                    
                    start_time = time.time()
                    df = parser.stats_raw_parse_sents(sents, arto=True)
                    parse_time = time.time() - start_time
                    debug_file.write("Parsing completed in {:.2f} seconds\n".format(parse_time))
                    debug_file.write("DataFrame shape: {} rows x {} columns\n".format(
                        df.shape[0] if hasattr(df, 'shape') else 'unknown', 
                        df.shape[1] if hasattr(df, 'shape') else 'unknown'))
                    
                    # Write DataFrame sample
                    if hasattr(df, 'head'):
                        debug_file.write("DataFrame head:\n{}\n".format(str(df.head())))
                    
                    # Critical path fix - ensure we write to the expected location
                    # First check if output_prefix already ends with '/output' 
                    if output_prefix.endswith('/output'):
                        output_path = os.path.join(output_prefix, 'results.csv')
                    else:
                        # Handle both paths with and without trailing slash
                        output_path = os.path.join(output_prefix, 'results.csv')
                    
                    debug_file.write("Writing results to: {}\n".format(output_path))
                    print("Writing results to {}".format(output_path))
                    
                    # Verify the directory exists
                    output_dir = os.path.dirname(output_path)
                    if not os.path.exists(output_dir):
                        os.makedirs(output_dir)
                        debug_file.write("Created output directory: {}\n".format(output_dir))
                        
                    # Also ensure any parent directories in output path exist
                    if not os.path.exists(os.path.dirname(output_path)):
                        os.makedirs(os.path.dirname(output_path))
                        debug_file.write("Created parent directories for: {}\n".format(output_path))
                    
                    # Use direct path approach to avoid file handle encoding issues
                    try:
                        df.to_csv(output_path, index=False, encoding='utf-8')
                        debug_file.write("Results successfully written to file\n")
                    except (IOError, OSError) as e:
                        debug_file.write("Error writing to file: {}\n".format(str(e)))
                        raise
                    
                    # Explicitly verify the file was created
                    if os.path.exists(output_path):
                        file_size = os.path.getsize(output_path)
                        print("Successfully wrote results.csv ({} bytes)".format(file_size))
                        debug_file.write("Verified file exists: {} ({} bytes)\n".format(
                            output_path, file_size))
                            
                        # Add extra verification paths to debug potential issues
                        debug_file.write("Directory listing of {}:\n".format(output_dir))
                        try:
                            files_in_dir = os.listdir(output_dir)
                            for file_name in files_in_dir:
                                file_path = os.path.join(output_dir, file_name)
                                file_size = os.path.getsize(file_path)
                                debug_file.write("  {} ({} bytes)\n".format(file_name, file_size))
                        except Exception as e:
                            debug_file.write("  Error listing directory: {}\n".format(str(e)))
                    else:
                        error_msg = "File write appeared to succeed but results.csv not found!"
                        print(error_msg)
                        debug_file.write(error_msg + "\n")
                        
                        # Try to identify any similar files in the directory
                        debug_file.write("Searching for any CSV files in {}:\n".format(output_dir))
                        try:
                            for root, dirs, files in os.walk(output_dir):
                                for file in files:
                                    if file.endswith('.csv'):
                                        file_path = os.path.join(root, file)
                                        debug_file.write("  Found: {} ({} bytes)\n".format(
                                            file_path, os.path.getsize(file_path)))
                        except Exception as e:
                            debug_file.write("  Error walking directory: {}\n".format(str(e)))
                            
                        raise IOError(error_msg)
                        
                except Exception as e:
                    error_msg = "Error processing file {}: {}".format(filename, str(e))
                    sys.stderr.write(error_msg + "\n")
                    debug_file.write("ERROR: " + error_msg + "\n")
                    debug_file.write("Traceback:\n")
                    traceback.print_exc(file=debug_file)
                    traceback.print_exc(file=sys.stderr)
                    # Re-raise to ensure the parent process knows there was an error
                    raise
            
            debug_file.write("\nAll processing completed successfully\n")
            return True
            
        except Exception as e:
            error_msg = "Fatal error in parse_worker: {}".format(str(e))
            sys.stderr.write(error_msg + "\n")
            debug_file.write("FATAL ERROR: " + error_msg + "\n") 
            debug_file.write("Traceback:\n")
            traceback.print_exc(file=debug_file)
            traceback.print_exc(file=sys.stderr)
            # Re-raise to ensure the parent process knows there was an error
            raise

# ***********************************************************************
# Split a text on certain punctuation


def pause_splitter(s):
    """"""

    s = s.strip()
    s = re.sub('([:;]|--+)', '\g<1>\n', s)
    s = s.split('\n')
    s = [sent for sents in s for sent in sent_splitter.tokenize(sents)]
    return s

# ***********************************************************************
# Metrical Tree class


class MetricalTree(DependencyTree):
    """"""

    _unstressedWords = ('it',) if not unstressed_words else tuple(
        unstressed_words)
    _unstressedTags = ('CC', 'PRP$', 'TO', 'UH',
                       'DT') if not unstressed_tags else tuple(unstressed_tags)
    _unstressedDeps = (
        'det', 'expl', 'cc', 'mark') if not unstressed_deps else tuple(unstressed_deps)
    _ambiguousWords = ('this', 'that', 'these',
                       'those') if not ambiguous_words else tuple(ambiguous_words)
    _ambiguousTags = ('MD', 'IN', 'PRP', 'WP$', 'PDT', 'WDT', 'WP',
                      'WRB') if not ambiguous_tags else tuple(ambiguous_tags)
    _ambiguousDeps = ('cop', 'neg', 'aux',
                      'auxpass') if not ambiguous_deps else tuple(ambiguous_deps)
    _stressedWords = tuple() if not stressed_words else tuple(stressed_words)

    # =====================================================================
    # Initialize
    def __init__(self, node, children, dep=None, lstress=0, pstress=np.nan, stress=np.nan):
        """"""

        self._lstress = lstress
        self._pstress = pstress
        self._stress = stress
        super(MetricalTree, self).__init__(node, children, dep)
        self.set_label()
        if self._preterm:
            if self[0].lower() in sylcmu:
                syll_info = sylcmu[self[0].lower()]
                self._seg = syll_info[0]
                self._nsyll = len(syll_info[1])
                self._nstress = len(
                    filter(lambda x: x[1] in ('P', 'S'), syll_info[1]))
            else:
                self._seg = None
                self._nsyll = np.nan
                self._nstress = np.nan

    # =====================================================================
    # Get the lexical stress of the node
    def lstress(self):
        """"""

        return self._lstress

    # =====================================================================
    # Get the phrasal stress of the node
    def pstress(self):
        """"""

        return self._pstress

    # =====================================================================
    # Get the stress of the node
    def stress(self):
        """"""

        return self._stress

    # =====================================================================
    # Get the segments
    def seg(self):
        """"""

        return self._seg if self._seg is not None else []

    # =====================================================================
    # Get the number of segments
    def nseg(self):
        """"""

        return len(self._seg) if self._seg is not None else np.nan

    # =====================================================================
    # Get the number of syllables
    def nsyll(self):
        """"""

        return self._nsyll

    # =====================================================================
    # Get the number of stresses
    def nstress(self):
        """"""

        return self._nstress

    # =====================================================================
    # Get the lexical stress of the leaf nodes
    def lstresses(self, leaves=True):
        """"""

        for preterminal in self.preterminals(leaves=True):
            if leaves:
                yield (preterminal._lstress, preterminal[0])
            else:
                yield preterminal._lstress

    # =====================================================================
    # Get the phrasal stress of the leaf nodes
    def pstresses(self, leaves=True):
        """"""

        for preterminal in self.preterminals(leaves=True):
            if leaves:
                yield (preterminal._pstress, preterminal[0])
            else:
                yield preterminal._pstress

    # =====================================================================
    # Get the lexical stress of the leaf nodes
    def stresses(self, leaves=True, arto=False):
        """"""

        for preterminal in self.preterminals(leaves=True):
            if leaves:
                if arto:
                    if preterminal._stress is None:
                        yield (None, preterminal[0])
                    elif preterminal._lstress == -1:
                        yield (0, preterminal[0])
                    else:
                        yield (-(preterminal._stress-1), preterminal[0])
                else:
                    yield (preterminal._stress, preterminal[0])
            else:
                if arto:
                    if preterminal._stress is None:
                        yield None
                    elif preterminal._lstress == -1:
                        yield 0
                    else:
                        yield -(preterminal._stress-1)
                else:
                    yield preterminal._stress

    # =====================================================================
    # Get the number of syllables of the leaf nodes
    def nsylls(self, leaves=True):
        """"""

        for preterminal in self.preterminals(leaves=True):
            if leaves:
                yield (preterminal._nsyll, preterminal[0])
            else:
                yield preterminal._nsyll

    # =====================================================================
    # Set the lexical stress of the node
    def set_lstress(self):
        """"""

        if self._preterm:
            if self[0].lower() in super(MetricalTree, self)._contractables:
                self._lstress = np.nan
            elif self._cat in super(MetricalTree, self)._punctTags:
                self._lstress = np.nan

            elif self[0].lower() in MetricalTree._unstressedWords:
                self._lstress = -1
            elif self[0].lower() in MetricalTree._ambiguousWords:
                self._lstress = -.5
            elif self[0].lower() in MetricalTree._stressedWords:
                self._lstress = 0

            elif self._cat in MetricalTree._unstressedTags:
                self._lstress = -1
            elif self._cat in MetricalTree._ambiguousTags:
                self._lstress = -.5

            elif self._dep in MetricalTree._unstressedDeps:
                self._lstress = -1
            elif self._dep in MetricalTree._ambiguousDeps:
                self._lstress = -.5

            else:
                self._lstress = 0

            if self[0].lower() == 'that' and (self._cat == 'DT' or self._dep == 'det'):
                self._lstress = -.5
        else:
            for child in self:
                child.set_lstress()
        self.set_label()

    # =====================================================================
    # Set the phrasal stress of the tree
    def set_pstress(self):
        """"""

        # Basis
        if self._preterm:
            try:
                assert self._lstress != -.5
            except:
                raise ValueError(
                    'The tree must be disambiguated before assigning phrasal stress')
            self._pstress = self._lstress
        else:
            # Recurse
            for child in self:
                child.set_pstress()
            assigned = False
            # Noun compounds (look for sequences of N*)
            if self._cat == 'NP':
                skipIdx = None
                i = len(self)
                for child in self[::-1]:
                    i -= 1
                    if child._cat.startswith('NN'):
                        if not assigned and skipIdx is None:
                            skipIdx = i
                            child._pstress = -1
                            child.set_label()
                        elif not assigned:
                            child._pstress = 0
                            child.set_label()
                            assigned = True
                        else:
                            child._pstress = -1
                            child.set_label()
                    elif assigned:
                        child._pstress = -1
                        child.set_label()
                    else:
                        if not assigned and skipIdx is not None:
                            self[skipIdx]._pstress = 0
                            self[skipIdx].set_label()
                            assigned = True
                            child._pstress = -1
                            child.set_label()
                        else:
                            break
                if not assigned and skipIdx is not None:
                    self[skipIdx]._pstress = 0
                    self[skipIdx].set_label()
                    assigned = True
            # Everything else
            if not assigned:
                for child in self[::-1]:
                    if not assigned and child._pstress == 0:
                        assigned = True
                    elif not np.isnan(child._pstress):
                        child._pstress = -1
                        child.set_label()
            if not assigned:
                self._pstress = -1
            else:
                self._pstress = 0
        self.set_label()

    # =====================================================================
    # Set the total of the tree
    def set_stress(self, stress=0):
        """"""

        self._stress = self._lstress + self._pstress + stress
        if not self._preterm:
            for child in self:
                child.set_stress(self._stress)
        self.set_label()

    # =====================================================================
    # Reset the label of the node (cat < dep < lstress < pstress < stress
    def set_label(self):
        """"""

        if self._stress is not np.nan:
            self._label = '%s/%s' % (self._cat, self._stress)
        elif self._pstress is not np.nan:
            self._label = '%s/%s' % (self._cat, self._pstress)
        elif self._lstress is not np.nan:
            self._label = '%s/%s' % (self._cat, self._lstress)
        elif self._dep is not None:
            self._label = '%s/%s' % (self._cat, self._dep)
        else:
            self._label = '%s' % self._cat

    # =====================================================================
    # Convert between different subtypes of Metrical Trees
    @classmethod
    def convert(cls, tree):
        """
        Convert a tree between different subtypes of Tree.  ``cls`` determines
        which class will be used to encode the new tree.

        :type tree: Tree
        :param tree: The tree that should be converted.
        :return: The new Tree.
        """

        if isinstance(tree, Tree):
            children = [cls.convert(child) for child in tree]
            if isinstance(tree, MetricalTree):
                return cls(tree._cat, children, tree._dep, tree._lstress)
            elif isinstance(tree, DependencyTree):
                return cls(tree._cat, children, tree._dep)
            else:
                return cls(tree._label, children)
        else:
            return tree

    # =====================================================================
    # Approximate the number of ambiguous parses
    def ambiguity(self, stress_polysyll=False):
        """"""

        nambig = 0
        for preterminal in self.preterminals():
            if preterminal.lstress() == -.5:
                if not stress_polysyll or (preterminal.nsyll() == 1):
                    nambig += 1
        return nambig

    # =====================================================================
    # Generate all possible trees
    # Syll=True sets all polysyllabic words to stressed
    def disambiguate(self, stress_polysyll=False):
        """"""

        if self._preterm:
            if self._lstress != -.5:
                return [self.copy()]
            else:
                alts = []
                if not stress_polysyll or self._nsyll == 1:
                    self._lstress = -1
                    alts.append(self.copy())
                self._lstress = 0
                alts.append(self.copy())
                self._lstress = -.5
                return alts
        else:
            alts = [[]]
            for child in self:
                child_alts = child.disambiguate(stress_polysyll)
                for i in xrange(len(alts)):
                    alt = alts.pop(0)
                    for child_alt in child_alts:
                        alts.append(alt + [child_alt])
            return [MetricalTree(self._cat, alt, self._dep) for alt in alts]

    # =====================================================================
    # Disambiguate a tree with the maximal stressed pattern
    def max_stress_disambiguate(self):
        """"""

        if self._preterm:
            if self._lstress != -.5:
                return [self.copy()]
            else:
                alts = []
                self._lstress = 0
                alts.append(self.copy())
                self._lstress = -.5
                return alts
        else:
            alts = [[]]
            for child in self:
                child_alts = child.max_stress_disambiguate()
                for i in xrange(len(alts)):
                    alt = alts.pop(0)
                    for child_alt in child_alts:
                        alts.append(alt + [child_alt])
            return [MetricalTree(self._cat, alt, self._dep) for alt in alts]

    # =====================================================================
    # Disambiguate a tree with the minimal stressed pattern
    def min_stress_disambiguate(self, stress_polysyll=False):
        """"""

        if self._preterm:
            if self._lstress != -.5:
                return [self.copy()]
            else:
                alts = []
                if not stress_polysyll or self._nsyll == 1:
                    self._lstress = -1
                else:
                    self._lstress = 0

                alts.append(self.copy())
                self._lstress = -.5
                return alts
        else:
            alts = [[]]
            for child in self:
                child_alts = child.min_stress_disambiguate(stress_polysyll)
                for i in xrange(len(alts)):
                    alt = alts.pop(0)
                    for child_alt in child_alts:
                        alts.append(alt + [child_alt])
            return [MetricalTree(self._cat, alt, self._dep) for alt in alts]

    # =====================================================================
    # Copy the tree
    def copy(self, deep=False):
        """"""

        if not deep:
            return type(self)(self._cat, self, dep=self._dep, lstress=self._lstress)
        else:
            return type(self).convert(self)

# ***********************************************************************
# Parser for Metrical Trees


class MetricalTreeParser:
    """"""

    # =====================================================================
    # Initialize
    def __init__(self, deptreeParser=None):
        """"""

        if deptreeParser is None:
            sys.stderr.write('No deptreeParser provided, defaulting to PCFG\n')
            deptreeParser = 'PCFG'
        if isinstance(deptreeParser, compat.string_types):
            deptreeParser = DependencyTreeParser(
                model_path=os.path.join(script_dir, 'stanford-parser-full-%s/edu/stanford/nlp/models/lexparser/english%s.ser.gz' % (DATE, deptreeParser)))
        elif not isinstance(deptreeParser, DependencyTreeParser):
            raise ValueError('Provided an invalid dependency tree parser')
        self.deptreeParser = deptreeParser

    # =====================================================================
    # Use StanfordParser to parse a list of tokens
    def dep_parse_sents(self, sentences, verbose=False):
        """"""

        return self.deptreeParser.parse_sents(sentences, verbose)

    # =====================================================================
    # Use StanfordParser to parse a raw sentence
    def dep_raw_parse(self, sentence, verbose=False):
        """"""

        return self.deptreeParser.raw_parse(sentence, verbose)

    # =====================================================================
    # Use StanfordParser to parse multiple raw sentences
    def dep_raw_parse_sents(self, sentences, verbose=False):
        """"""

        return self.deptreeParser.raw_parse_sents(sentences, verbose)

    # =====================================================================
    # Use StanfordParser to parse multiple preprocessed sentences
    def dep_tagged_parse_sent(self, sentence, verbose=False):
        """"""

        return self.deptreeParser.tagged_parse_sent(sentence, verbose)

    # =====================================================================
    # Use StanfordParser to parse multiple preprocessed sentences
    def dep_tagged_parse_sents(self, sentences, verbose=False):
        """"""

        return self.deptreeParser.tagged_parse_sents(sentences, verbose)

    # =====================================================================
    # Parse a list of tokens into lexical Metrical Trees
    def lex_parse_sents(self, sentences, verbose=False):
        """"""

        sentences = self.dep_parse_sents(sentences, verbose)
        for tree in sentences:
            for t in tree:
                t = MetricalTree.convert(t)
                t.set_lstress()
                yield t

    # =====================================================================
    # Parse a raw sentence into lexical Metrical Trees
    def lex_raw_parse(self, sentence, verbose=False):
        """"""

        sentence = self.dep_raw_parse(sentence, verbose)
        for t in sentence:
            t = MetricalTree.convert(t)
            t.set_lstress()
            yield t

    # =====================================================================
    # Parse a string into lexical Metrical Trees
    def lex_raw_parse_sents(self, sentences, verbose=False):
        """"""

        sentences = self.dep_raw_parse_sents(sentences, verbose)
        for tree in sentences:
            for t in tree:
                t = MetricalTree.convert(t)
                t.set_lstress()
                yield t

    # =====================================================================
    # Parse a tagged sentence into lexical Metrical Trees
    def lex_tagged_parse(self, sentence, verbose=False):
        """"""

        sentence = self.dep_tagged_parse(sentence, verbose)
        for t in sentence:
            t = MetricalTree.convert(t)
            t.set_lstress()
            yield t

    # =====================================================================
    # Parse a raw sentence into lexical Metrical Trees
    def lex_tagged_parse_sents(self, sentences, verbose=False):
        """"""

        sentences = self.dep_tagged_parse_sents(sentences, verbose)
        for tree in sentences:
            for t in tree:
                t = MetricalTree.convert(t)
                t.set_lstress()
                yield t

    # =====================================================================
    # Parse a list of tokens into phrasal Metrical Trees
    def phr_parse_sents(self, sentences, stress_polysyll=False, verbose=True):
        """"""

        for t in self.lex_parse_sents(sentences, verbose):
            trees = t.disambiguate(stress_polysyll)
            for tree in trees:
                tree.set_pstress()
                tree.set_stress()
            yield trees

    # =====================================================================
    # Parse a string into phrasal Metrical Trees
    def phr_raw_parse(self, sentences, stress_polysyll=False, verbose=True):
        """"""

        for t in self.lex_raw_parse(sentences, verbose):
            trees = t.disambiguate(stress_polysyll)
            for tree in trees:
                tree.set_pstress()
                tree.set_stress()
            yield trees

    # =====================================================================
    # Parse a list of strings into phrasal Metrical Trees
    def phr_raw_parse_sents(self, sentences, stress_polysyll=False, verbose=True):
        """"""

        for t in self.lex_raw_parse_sents(sentences, verbose):
            trees = t.disambiguate(stress_polysyll)
            for tree in trees:
                tree.set_pstress()
                tree.set_stress()
            yield trees

    # =====================================================================
    # Parse a list of tagged strings into phrasal Metrical Trees
    def phr_tagged_parse(self, sentences, stress_polysyll=False, verbose=True):
        """"""

        for t in self.lex_tagged_parse(sentences, verbose):
            trees = t.disambiguate(stress_polysyll)
            for tree in trees:
                tree.set_pstress()
                tree.set_stress()
            yield trees

    # =====================================================================
    # Parse a list of strings into phrasal Metrical Trees
    def phr_tagged_parse_sents(self, sentences, stress_polysyll=False, verbose=True):
        """"""

        for t in self.lex_tagged_parse_sents(sentences, verbose):
            trees = t.disambiguate(stress_polysyll)
            for tree in trees:
                tree.set_pstress()
                tree.set_stress()
            yield trees

    # =============================================================
    def get_stats(self, generator, arto=False):
        """"""

        data = defaultdict(list)
        i = 0
        for t in generator:
            i += 1
            ambig1 = t.ambiguity(stress_polysyll=False)
            ambig2 = t.ambiguity(stress_polysyll=True)
            tree1 = t.max_stress_disambiguate()[0]
            tree1.set_pstress()
            tree1.set_stress()
            tree2a = t.min_stress_disambiguate(stress_polysyll=True)[0]
            tree2a.set_pstress()
            tree2a.set_stress()
            tree2b = t.min_stress_disambiguate(stress_polysyll=False)[0]
            tree2b.set_pstress()
            tree2b.set_stress()

            j = 0
            preterms1 = list(tree1.preterminals())
            min1 = float(min(
                [preterm.stress() for preterm in preterms1 if not np.isnan(preterm.stress())]))
            max1 = max([preterm.stress() for preterm in preterms1 if not np.isnan(
                preterm.stress())]) - min1
            preterms2a = list(tree2a.preterminals())
            min2a = float(min(
                [preterm.stress() for preterm in preterms2a if not np.isnan(preterm.stress())]))
            max2a = max([preterm.stress() for preterm in preterms2a if not np.isnan(
                preterm.stress())]) - min2a
            preterms2b = list(tree2b.preterminals())
            min2b = float(min(
                [preterm.stress() for preterm in preterms2b if not np.isnan(preterm.stress())]))
            max2b = max([preterm.stress() for preterm in preterms2b if not np.isnan(
                preterm.stress())]) - min2b
            preterms_raw = list(t.preterminals())
            minmean = float(min([np.mean([preterm1.stress(), preterm2a.stress(), preterm2b.stress()]) for preterm1,
                            preterm2a, preterm2b in zip(preterms1, preterms2a, preterms2b) if not np.isnan(preterm1.stress())]))
            maxmean = max([np.mean([preterm1.stress(), preterm2a.stress(), preterm2b.stress()]) for preterm1, preterm2a,
                          preterm2b in zip(preterms1, preterms2a, preterms2b) if not np.isnan(preterm1.stress())]) - minmean
            sent = ' '.join([preterm[0] for preterm in preterms_raw])
            sentlen = len(preterms_raw)
            for preterm1, preterm2a, preterm2b, preterm_raw in zip(preterms1, preterms2a, preterms2b, preterms_raw):
                j += 1
                data['widx'].append(j)
                data['norm_widx'].append(float(j) / sentlen)
                data['word'].append(preterm1[0])
                if preterm_raw._lstress == 0:
                    data['lexstress'].append('yes')
                elif preterm_raw._lstress == -.5:
                    data['lexstress'].append('ambig')
                elif preterm_raw._lstress == -1:
                    data['lexstress'].append('no')
                else:
                    data['lexstress'].append('???')
                data['seg'].append(' '.join(preterm1.seg()))
                data['nseg'].append(preterm1.nseg())
                data['nsyll'].append(preterm1.nsyll())
                data['nstress'].append(preterm1.nstress())
                data['pos'].append(preterm1.category())
                data['dep'].append(preterm1.dependency())
                if arto:
                    data['m1'].append(-(preterm1.stress()-1))
                    data['m2a'].append(-(preterm2a.stress()-1))
                    data['m2b'].append(-(preterm2b.stress()-1))
                    data['mean'].append(-(np.mean([preterm1.stress(),
                                        preterm2a.stress(), preterm2b.stress()])-1))
                else:
                    data['m1'].append(preterm1.stress())
                    data['m2a'].append(preterm2a.stress())
                    data['m2b'].append(preterm2b.stress())
                    data['mean'].append(
                        np.mean([preterm1.stress(), preterm2a.stress(), preterm2b.stress()]))
                # Handle normalization edge cases to prevent division by zero
                if max1 == 0:
                    # When all words have the same stress, use 0.5 as normalized value
                    data['norm_m1'].append(0.5)
                else:
                    data['norm_m1'].append((preterm1.stress()-min1)/max1)
                    
                if max2a == 0:
                    data['norm_m2a'].append(0.5)
                else:
                    data['norm_m2a'].append((preterm2a.stress()-min2a)/max2a)
                    
                if max2b == 0:
                    data['norm_m2b'].append(0.5)
                else:
                    data['norm_m2b'].append((preterm2b.stress()-min2b)/max2b)
                    
                mean_stress = np.mean([preterm1.stress(), preterm2a.stress(), preterm2b.stress()])
                if maxmean == 0:
                    data['norm_mean'].append(0.5)
                else:
                    data['norm_mean'].append((mean_stress-minmean)/maxmean)
                data['sidx'].append(i)
                data['sent'].append(sent)
                data['ambig_words'].append(ambig1)
                data['ambig_monosyll'].append(ambig2)
            data['contour'].extend([' '.join(str(x)
                                   for x in data['mean'][-(j):])]*j)
        for k, v in data.iteritems():
            data[k] = pd.Series(v)
        return pd.DataFrame(data, columns=['widx', 'norm_widx', 'word', 'seg', 'lexstress',
                                           'nseg', 'nsyll', 'nstress',
                                           'pos', 'dep',
                                           'm1', 'm2a', 'm2b', 'mean',
                                           'norm_m1', 'norm_m2a', 'norm_m2b', 'norm_mean',
                                           'sidx', 'sent', 'ambig_words', 'ambig_monosyll',
                                           'contour'])

    # =====================================================================
    # Parse a list of tokens into phrasal Metrical Trees
    def stats_parse_sents(self, sentences, arto=False, verbose=True):
        """"""

        return self.get_stats(self.lex_parse_sents(sentences, verbose), arto=arto)

    # =====================================================================
    # Parse a string into phrasal Metrical Trees
    def stats_raw_parse(self, sentence, arto=False, verbose=True):
        """"""

        return self.get_stats(self.lex_raw_parse(sentence, verbose), arto=arto)

    # =====================================================================
    # Parse a string into phrasal Metrical Trees
    def stats_raw_parse_sents(self, sentences, arto=False, verbose=True):
        """"""

        return self.get_stats(self.lex_raw_parse_sents(sentences, verbose), arto=arto)

    # =====================================================================
    # Parse a list of tagged tokens into phrasal Metrical Trees
    def stats_tagged_parse(self, sentence, arto=False, verbose=True):
        """"""

        return self.get_stats(self.lex_tagged_parse(sentence, verbose), arto=arto)

    # =====================================================================
    # Parse a list of tagged tokens into phrasal Metrical Trees
    def stats_tagged_parse_sents(self, sentences, arto=False, verbose=True):
        """"""

        return self.get_stats(self.lex_tagged_parse_sents(sentences, verbose), arto=arto)


# ***********************************************************************
# Test the module
if __name__ == '__main__':
    """"""

    import glob
    import re
    import multiprocessing as mp
    import sys

    file = args.input
    files = [file]
    try:
        workers = mp.cpu_count()
    except:
        workers = 1

    q = mp.Queue()
    for filename in files:
        q.put(filename)
    for worker in xrange(workers):
        q.put('STOP')
    processes = []
    for worker in xrange(workers):
        process = mp.Process(target=parse_worker, args=(q,))
        process.start()
        processes.append(process)
    for process in processes:
        process.join()

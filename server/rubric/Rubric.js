/**
 * Composite pattern: Rubric tree of sections (composites) and criteria (leaves).
 */

class RubricComponent {
  getMarkingScheme() {
    throw new Error('RubricComponent: getMarkingScheme() must be implemented');
  }

  getStudentView() {
    throw new Error('RubricComponent: getStudentView() must be implemented');
  }

  getTotalPoints() {
    throw new Error('RubricComponent: getTotalPoints() must be implemented');
  }
}

class CriterionLeaf extends RubricComponent {
  /**
   * @param {string} heading
   * @param {number} points
   */
  constructor(heading, points) {
    super();
    this.heading = heading;
    this.points = points;
  }

  getMarkingScheme() {
    return { kind: 'criterion', heading: this.heading, points: this.points };
  }

  getStudentView() {
    return { kind: 'criterion', heading: this.heading, maxPoints: this.points };
  }

  getTotalPoints() {
    return this.points;
  }
}

class SectionComposite extends RubricComponent {
  /**
   * @param {string} heading
   */
  constructor(heading) {
    super();
    this.heading = heading;
    /** @type {RubricComponent[]} */
    this.children = [];
  }

  /**
   * @param {RubricComponent} component
   */
  add(component) {
    this.children.push(component);
    return this;
  }

  /**
   * @param {string} heading
   * @param {number} points
   */
  addCriterion(heading, points) {
    const leaf = new CriterionLeaf(heading, points);
    this.add(leaf);
    return leaf;
  }

  getMarkingScheme() {
    return {
      kind: 'section',
      heading: this.heading,
      children: this.children.map((c) => c.getMarkingScheme()),
    };
  }

  getStudentView() {
    return {
      kind: 'section',
      heading: this.heading,
      children: this.children.map((c) => c.getStudentView()),
    };
  }

  getTotalPoints() {
    return this.children.reduce((sum, c) => sum + c.getTotalPoints(), 0);
  }

  /**
   * @param {string} sectionHeading
   */
  findOrCreateSection(sectionHeading) {
    let section = this.children.find(
      (c) => c instanceof SectionComposite && c.heading === sectionHeading
    );
    if (!section) {
      section = new SectionComposite(sectionHeading);
      this.add(section);
    }
    return section;
  }
}

class Rubric extends RubricComponent {
  constructor() {
    super();
    this.root = new SectionComposite('Rubric');
  }

  /**
   * Build composite structure. Optional section nests criteria under a heading.
   * @param {string} heading
   * @param {number} points
   * @param {string} [sectionHeading]
   */
  addCriterion(heading, points, sectionHeading = null) {
    if (sectionHeading) {
      const section = this.root.findOrCreateSection(sectionHeading);
      return section.addCriterion(heading, points);
    }
    return this.root.addCriterion(heading, points);
  }

  getMarkingScheme() {
    return this.root.getMarkingScheme();
  }

  getStudentView() {
    return this.root.getStudentView();
  }

  getTotalPoints() {
    return this.root.getTotalPoints();
  }
}

module.exports = {
  Rubric,
  RubricComponent,
  CriterionLeaf,
  SectionComposite,
};
